export default async function handler(req, res) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "city parameter required" });
  }

  const response = await fetch(
    `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(city)}`,
    {
      headers: {
        'Authorization': `Key ${process.env.GOLF_API_KEY}`
      }
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
