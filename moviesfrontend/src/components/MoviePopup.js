
import React,{useEffect,useState,useContext} from "react"
import {getMovie} from "../services/api"
import {WatchlistContext} from "../context/WatchlistContext"

export default function MoviePopup({movieId,close}){

const [movie,setMovie] = useState(null)

const {addMovie} = useContext(WatchlistContext)

useEffect(()=>{

async function load(){

const data = await getMovie(movieId)
setMovie(data)

}

load()
 
},[movieId])

if(!movie) return null

return(

<div className="popup">

<div className="popup-box">

<button className="close" onClick={close}>X</button>

<img src={movie.Poster} alt=""/>

<h2>{movie.Title}</h2>

<p>{movie.Plot}</p>

<p>Year: {movie.Year}</p>
<p>Language: {movie.Language}</p>
<p>Rating ⭐ {movie.imdbRating}</p>

<button onClick={() => addMovie(movie)}>Add to Watchlist</button>
<button>▶ Watch Now</button>
<button>⬇ Download</button>

</div>

</div>

)

}