import React from "react";

function DeleteAccount() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete account?")) {
      fetch("http://localhost:5000/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      })
        .then(() => {
          localStorage.clear();
          window.location.reload();
        });
    }
  };

  return (
    <div>
      <h2>Delete Account</h2>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

export default DeleteAccount;