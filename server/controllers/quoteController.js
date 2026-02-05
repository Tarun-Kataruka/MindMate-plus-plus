export const getDailyQuote = async (req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();

    if (!data?.length) {
      return res.status(500).json({ content: '', author: 'Unknown' });
    }

    res.json({ content: data[0].q, author: data[0].a });
  } catch (err) {
    if (err.message !== 'Unexpected end of JSON input') {
      console.error('Error fetching quote from ZenQuotes:', err.message);
    }
    res.json({ content: 'Deep inside, you already know the answer. Trust yourself.', author: 'MindMate' });
  }
};
