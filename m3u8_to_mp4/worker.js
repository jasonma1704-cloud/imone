// WebWorker 跨域请求，绕过主线程部分CORS限制
self.onmessage = async (e) => {
  if(e.data.type === 'fetch'){
    try {
      const res = await fetch(e.data.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': ''
        },
        mode: 'cors',
        credentials: 'omit'
      });
      if(!res.ok) throw new Error('请求状态码：'+res.status);
      const buf = await res.arrayBuffer();
      self.postMessage({buffer:buf});
    } catch (err) {
      self.postMessage({error:err.message});
    }
  }
};