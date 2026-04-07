import React from "react";
import Slider from "react-slick";
import "./MovieSlider.css";

function MovieSlider() {

  const movies = [
    {
      title: "Avengers",
      image: "https://w.wallhaven.cc/full/4o/wallhaven-4oemx5.jpg",
      trailer: "https://www.youtube.com/results?search_query=avengers+trailer"
    },
    {
      title: "Batman",
      image: "https://w.wallhaven.cc/full/4x/wallhaven-4xyk7o.jpg",
      trailer: "https://www.youtube.com/results?search_query=batman+trailer"
    },
    {
      title: "Spider Man",
      image: "https://w.wallhaven.cc/full/9m/wallhaven-9mezzx.jpg",
      trailer: "https://www.youtube.com/results?search_query=spiderman+trailer"
    },
    {
      title: "Frozen",
      image: "https://w.wallhaven.cc/full/4y/wallhaven-4ymw1g.jpg",
      trailer: "https://www.youtube.com/results?search_query=frozen+trailer"
    },
    {
      title: "Joker",
      image: "https://w.wallhaven.cc/full/r2/wallhaven-r26y1j.png",
      trailer: "https://www.youtube.com/results?search_query=joker+trailer"
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 1000, // Slower speed for fade effect
    autoplaySpeed: 3000,
    fade: true, // Use fade transition
    cssEase: 'linear',
    slidesToShow: 1,
    slidesToScroll: 1
  };

  const addToWatchlist = (movie) => {
    let list = JSON.parse(localStorage.getItem("watchlist")) || [];
    list.push(movie);
    localStorage.setItem("watchlist", JSON.stringify(list));
    alert(movie.title + " added to Watchlist");
  };

  return (
    <>
      <style>{`
        .slider-container {
          position: relative;
          margin-top: -80px; /* Counteract App's padding-top to fill screen */
          width: 100%;
          height: 100vh;
          z-index: 0; /* Position behind navbar */
          overflow: hidden;
        }

        .slide {
          position: relative;
          height: 100vh;
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Dark overlay for text readability */
        .slide::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 100%);
        }

        .slide-content {
          position: absolute;
          bottom: 25vh;
          left: 5%;
          z-index: 2;
          color: white;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.9);
        }
        
        .movie-title {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: bold;
          margin: 0;
        }

        .slide-buttons {
          position: absolute;
          bottom: 12vh;
          left: 5%;
          z-index: 2;
          display: flex;
          gap: 15px;
        }
        
        .slide-buttons .watch-btn, 
        .slide-buttons .watchlist-btn {
          padding: 12px 24px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slide-buttons .watch-btn {
          background-color: #e50914;
          color: white;
        }
        .slide-buttons .watch-btn:hover {
          background-color: #f40612;
          transform: scale(1.05);
        }

        .slide-buttons .watchlist-btn {
          background-color: rgba(109, 109, 110, 0.7);
          color: white;
        }
        .slide-buttons .watchlist-btn:hover {
          background-color: rgba(109, 109, 110, 1);
          transform: scale(1.05);
        }

        .slick-dots {
          bottom: 25px;
        }
        .slick-dots li button:before {
          font-size: 12px;
          color: white;
          opacity: 0.7;
        }
        .slick-dots li.slick-active button:before {
          opacity: 1;
          color: #e50914;
        }
      `}</style>
      <div className="slider-container">
        <Slider {...settings}>
          {movies.map((movie, index) => (
            <div key={index} className="slide">
              <img src={movie.image} alt={movie.title} />
              <div className="slide-content">
                <h1 className="movie-title">{movie.title}</h1>
              </div>
              <div className="slide-buttons">
                <a href={movie.trailer} target="_blank" rel="noreferrer">
                  <button className="watch-btn">Watch Now</button>
                </a>
                <button
                  className="watchlist-btn"
                  onClick={() => addToWatchlist(movie)}
                >
                  Add to Watchlist
                </button>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </>
  );
}


export default MovieSlider;