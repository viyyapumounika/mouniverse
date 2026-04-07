
const API_KEY = "d371de37";

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