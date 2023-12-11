
function login(){
    const loginbtn = document.getElementById('loginBtn')
    loginbtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    loginbtn.setAttribute("disabled", "");
    const message1 = document.getElementById('login-msgs')

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;


    fetch("/oauth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password
      }),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      }})
    .then((response) => response.json())
    .then((json) => {
      loginbtn.innerHTML = `Login`;
      loginbtn.removeAttribute("disabled");

      if(json.status == 'error'){
        
        message1.innerHTML = `
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                      <p id="login-msg"><strong>ERRO:</strong> ${json.message}</p>
                      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>`
      }
      if(json.status == 'success'){
          window.location.reload()
      }
});
}

function register() {
  const username = document.getElementById('username').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value


  fetch("/oauth/register", {
      method: "POST",
      body: JSON.stringify({
          email: email,
          password: password,
          name: username
      }),
      headers: {
          'Content-Type': 'application/json; charset=UTF-8',
      }
  })
      .then((response) => response.json())
      .then((json) => {
        if(json.status == 'error'){
          document.getElementById('msg-response').innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Aviso:</strong> ${json.message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        }
        if(json.status == 'success'){
          window.location.replace('/login')
        }
          
          
      })
}

function reset() {
  const email = document.getElementById('email').value
  


  fetch("/oauth/resetcode", {
      method: "POST",
      body: JSON.stringify({
          email: email
      }),
      headers: {
          'Content-Type': 'application/json; charset=UTF-8',
      }
  })
      .then((response) => response.json())
      .then((json) => { console.log(json)})
}



