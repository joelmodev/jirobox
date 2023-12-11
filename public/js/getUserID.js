function getUserID(){
    fetch("/user", {
        method: "POST"
      })
        .then((response) => response.json())
        .then((response) => {
            const username = document.getElementById('username')
            const email = document.getElementById('username')
            
            username.innerHTML = response.username
        })
}

