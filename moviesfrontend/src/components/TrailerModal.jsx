import React from "react";

function TrailerModal({video,close}){

if(!video) return null;

return(

<div className="modal">

<div className="modal-content">

<button onClick={close}>X</button>

<iframe
width="800"
height="450"
src={`https://www.youtube.com/embed/${video}`}
title="trailer"
allowFullScreen
/>

</div>

</div>

);

}

export default TrailerModal;