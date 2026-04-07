
const API_KEY = import.meta.env.API_KEY; // Make sure to set this in your .env file

export const fetchMovies = async (search) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${API_KEY}&s=${search}`
  );
  const data = await res.json();
  return data.Search;
};

export const fetchMovieDetails = async (id) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`
  );
  const data = await res.json();
  return data;
};