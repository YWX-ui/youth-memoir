import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 内存数据库（Railway 重启会丢失，后面再接真实数据库）
const db = {
  classmates: [],
  messages: [],
  graffiti: [],
  letters: []
};

// ===== 同学录 =====
app.get('/api/classmates', (req, res) => {
  const q = req.query.q || '';
  if (q) {
    res.json(db.classmates.filter(c => c.name.includes(q)));
  } else {
    res.json(db.classmates);
  }
});

app.post('/api/classmates', (req, res) => {
  const { name, className, studentId, phone, wechat, createdBy } = req.body;
  if (!name) return res.status(400).json({ error: '姓名必填' });
  const existing = db.classmates.findIndex(c => c.name === name && c.createdBy === createdBy);
  const data = { name, className, studentId, phone, wechat, createdBy, createdAt: new Date().toISOString() };
  if (existing >= 0) db.classmates[existing] = data;
  else db.classmates.push(data);
  res.json({ success: true, data });
});

app.delete('/api/classmates/:name', (req, res) => {
  const { name } = req.params;
  const { createdBy } = req.query;
  db.classmates = db.classmates.filter(c => !(c.name === name && c.createdBy === createdBy));
  res.json({ success: true });
});

// ===== 赠言 =====
app.get('/api/messages', (req, res) => {
  const to = req.query.to || '';
  if (to) {
    res.json(db.messages.filter(m => m.to === to));
  } else {
    res.json(db.messages);
  }
});

app.post('/api/messages', (req, res) => {
  const { from, to, content } = req.body;
  if (!to || !content) return res.status(400).json({ error: '参数不完整' });
  // 敏感词过滤
  const badWords = ['他妈的','操','傻逼','fuck','shit','草泥马','你妈','sb','cnm','nmsl','wcnm','妈的','垃圾','废物','去死'];
  for (const w of badWords) {
    if (content.includes(w)) return res.status(400).json({ error: '内容包含不当词汇' });
  }
  const data = { from, to, content, createdAt: new Date().toISOString() };
  db.messages.push(data);
  res.json({ success: true, data });
});

app.delete('/api/messages/:createdAt', (req, res) => {
  db.messages = db.messages.filter(m => m.createdAt !== req.params.createdAt);
  res.json({ success: true });
});

// ===== 涂鸦 =====
app.get('/api/graffiti/:createdBy', (req, res) => {
  const list = db.graffiti.filter(g => g.createdBy === req.params.createdBy);
  res.json(list);
});

app.post('/api/graffiti', (req, res) => {
  const { dataUrl, createdBy } = req.body;
  if (!dataUrl || !createdBy) return res.status(400).json({ error: '参数不完整' });
  const data = { id: Date.now().toString(), dataUrl, createdBy, createdAt: new Date().toISOString() };
  db.graffiti.push(data);
  res.json({ success: true, data });
});

// ===== 匿名信 =====
app.get('/api/letters/:to', (req, res) => {
  const list = db.letters.filter(l => l.to === req.params.to);
  // 隐藏发信人
  res.json(list.map(l => ({ content: l.content, createdAt: l.createdAt })));
});

app.post('/api/letters', (req, res) => {
  const { to, content } = req.body;
  if (!to || !content) return res.status(400).json({ error: '参数不完整' });
  const data = { id: Date.now().toString(), to, content, createdAt: new Date().toISOString() };
  db.letters.push(data);
  res.json({ success: true, data });
});

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 青春回忆录 API 运行在端口 ${PORT}`);
});
