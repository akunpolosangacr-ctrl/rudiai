export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key } = req.body;
  if (key === 'ucimin') {
    return res.status(200).json({ status: true, message: "Authorized" });
  }
  return res.status(401).json({ status: false, message: "Invalid Key" });
}
