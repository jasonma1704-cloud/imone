const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const MAX_TASK = 2; // 限制最大同时转换任务，防服务器卡死
let nowTask = 0;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 临时存放目录
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// ===== 核心：自动清理过期文件（5分钟没下载直接删掉）=====
function clearExpiredFile() {
  const expireTime = 5 * 60 * 1000;
  fs.readdir(outputDir, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) return;
        if (Date.now() - stat.mtimeMs > expireTime) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// 每10分钟自动清理一次
setInterval(clearExpiredFile, 10 * 60 * 1000);
// 启动先清理一次
clearExpiredFile();

// 转换接口
app.post('/api/convert', (req, res) => {
  if (nowTask >= MAX_TASK) {
    return res.json({ error: '当前转换任务繁忙，请稍后再试' });
  }

  const { m3u8Url } = req.body;
  if (!m3u8Url) return res.json({ error: '请输入M3U8链接' });

  nowTask++;
  const fileName = `v_${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, fileName);
  const downloadUrl = `http://localhost:${PORT}/output/${fileName}`;

  let logMsg = '';
  const cmd = ffmpeg(m3u8Url)
    .inputOptions('-protocol_whitelist', 'file,http,https,tcp,tls,crypto')
    .outputOptions('-c', 'copy') // 流复制，不重新编码，极省内存
    .outputOptions('-movflags', 'frag_keyframe+empty_moov')
    .save(outputPath);

  // 实时进度
  cmd.on('progress', (p) => {
    logMsg = `已转换：${p.percent ? p.percent.toFixed(2) : 0}%`;
  });

  cmd.on('end', () => {
    nowTask--;
    res.json({
      success: true,
      downloadUrl,
      msg: '转换完成，可立即下载'
    });
  });

  cmd.on('error', (err) => {
    nowTask--;
    // 出错直接删垃圾文件
    if (fs.existsSync(outputPath)) fs.unlink(outputPath, ()=>{});
    res.json({ error: '转换失败：' + err.message });
  });
});

// 下载文件后 自动删除
app.get('/output/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  res.download(filePath, '视频_转换完成.mp4', () => {
    // 下载完成立刻删除，不占硬盘
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ 工具运行：http://localhost:${PORT}`);
  console.log(`✅ 已开启自动清理，不占用服务器内存/硬盘`);
});