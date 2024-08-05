import { useState, useEffect } from 'react';



const useBlockchainData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch blockchain data from API
        const response = await fetch('https://api.example.com/blockchain-data');
        const jsonData = await response.json();

        // Update state with fetched data
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch blockchain data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export default useBlockchainData;