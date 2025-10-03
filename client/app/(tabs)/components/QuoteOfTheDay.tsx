import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

type QuoteData = {
  content: string;
  author: string;
};

type QuoteOfTheDayProps = {
  apiBaseUrl?: string;
};

export default function QuoteOfTheDay({ apiBaseUrl }: QuoteOfTheDayProps) {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const baseUrl = apiBaseUrl ?? process.env.EXPO_PUBLIC_API_URL ?? '';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const res = await fetch(`${normalizedBase}api/quotes`);
        const data = await res.json();
        if (data?.content) {
          setQuoteData({ content: data.content, author: data.author || 'Unknown' });
        }
      } catch (e) {
        console.error('Failed to fetch quote:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [apiBaseUrl]);

  if (loading) {
    return <ActivityIndicator size="small" color="#000" style={{ marginTop: 20 }} />;
  }

  if (!quoteData) return null;

  return (
    <View style={styles.quoteBlock}>
      <View style={styles.quoteBg}>
        <Text style={styles.quoteText}>“{quoteData.content}”</Text>
        <Text style={styles.authorText}>— {quoteData.author}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quoteBlock: { alignSelf: 'stretch', marginBottom: 10 },
  quoteBg: {
    backgroundColor: '#ffeb3b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quoteText: { 
    color: '#212121', 
    fontSize: 16, 
    fontWeight: '500',
    textAlign: 'center',
  },
  authorText: {
    marginTop: 6,
    color: '#424242',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
