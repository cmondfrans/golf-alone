export default async function handler(req, res) {
  const response = await fetch(
    `https://api.golfcourseapi.com/v1/search?search_query=pebble+beach`,
    {
      headers: {
        'Authorization': `Key ${process.env.GOLF_API_KEY}`
      }
    }
  );

  const status = response.status;
  const data = await response.json();
  res.status(200).json({ status, data, key_present: !!process.env.GOLF_API_KEY });
}