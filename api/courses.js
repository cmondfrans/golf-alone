export default async function handler(req, res) {
  const { lat, lng, radius } = req.query;

  const response = await fetch(
    `https://api.golfcourseapi.com/v1/search?latitude=${lat}&longitude=${lng}&radius_miles=${radius}`,
    {
      headers: {
        'Authorization': `Key ${process.env.GOLF_API_KEY}`
      }
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}