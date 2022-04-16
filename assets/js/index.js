/*jshint esversion:9 */

const loginScreen = document.querySelector('.login-screen');
const loginActions = document.querySelector('.login-actions');
const loadingScreen = document.querySelector('.loading-screen');
const appScreen = document.querySelector('.app-screen');
const userNameInput = loginScreen.querySelector('.login-actions input');
const messagesContainer = document.querySelector('.messages-container');
const messageInput = document.querySelector('.chat-inputs input');
const sendMessageBtn = document.querySelector('.chat-inputs button');
const loggedUser = {};
let messagesInterval = null;
let userSessionInterval = null;
let errorsQty = 0;
let firstLoad = true;

function doLogin(){

    const username = userNameInput.value;

    if(username === '') {
        alert('Informe um nome de usuário que seja válido.');
        return false;
    }

    loginActions.classList.add('hidden');
    loadingScreen.classList.remove('hidden');
    
    axios.post('https://mock-api.driven.com.br/api/v6/uol/participants', { name: username }).then(response=>{

        loggedUser.name = username;
        initApp();

    }).catch(err=>{

        console.log(err.response);
        switch (err.response.status) {

            case 400:
                alert('Já existe um usuário online com este nome. Por favor, escolha outro.');
                userNameInput.value = '';
                loginScreen.classList.remove('hidden');
                loginActions.classList.remove('hidden');
                appScreen.classList.add('hidden');
                loadingScreen.classList.add('hidden');
                firstLoad = true;
                break;
        
            default:
                alert('Ocorre um erro desconhecido. Tente novamente.');
                userNameInput.value = '';
                unknownError();
                break;
        }

    });

}

function unknownError(){
    errorsQty++;
    if(errorsQty >= 3){
        alert('Ocorreu um erro desconhecido. Aguarde, vamos recarregar a página na sequência.');
        window.location.reload();
    }
}

function initLogin(){

    const buttonLogin = loginScreen.querySelector('.login-actions button');

    userNameInput.addEventListener('keyup', e=>{

        switch (e.key.toLowerCase()) {

            case 'enter':
                doLogin();
                break;
        
        }

    });

    buttonLogin.addEventListener('click', ()=>{
        doLogin();
    });

}

function initApp(){

    initUserSession();
    updateChatMessages();
    initInputs();

}

function initUserSession(){

    userSessionInterval = setInterval(()=>{
        axios.post('https://mock-api.driven.com.br/api/v6/uol/status', { name: loggedUser.name });
    }, 4000);

}

function updateChatMessages(){

    messagesInterval = setInterval(()=>{
        loadMessages();
    }, 3000);

}

function loadMessages(){

    axios.get('https://mock-api.driven.com.br/api/v6/uol/messages').then(response=>{

        renderMessages(response.data);

    }).catch(err=>{
        console.log(err);
        alert('Ocorre um erro desconhecido. Tente novamente.');
        unknownError();
    });

}

function filterMessage(message){

    if(message.type === 'status' || message.type === 'message'){
        return true;
    } else if(message.type === 'private_message'){
        return (message.from === loggedUser.name || message.to === loggedUser.name);
    }

}

function renderMessages(messages){

    messagesContainer.innerHTML = '';
    const availableMessages = messages.filter(message => filterMessage(message));

    for(let i = 0; i < availableMessages.length; i++){

        let messageContent = '';
        let messageClass = '';

        if(availableMessages[i].type === 'status'){

            messageClass = 'status-message';
            messageContent = `(${availableMessages[i].time})</span> <strong>${availableMessages[i].from}</strong> ${availableMessages[i].text}`;

        } else if(availableMessages[i].type === 'message'){

            messageContent = `(${availableMessages[i].time})</span> <strong>${availableMessages[i].from}</strong> para <strong>${availableMessages[i].to}:</strong> ${availableMessages[i].text}`;

        } else if(availableMessages[i].type === 'private_message'){

            messageClass = 'private-message';
            messageContent = `(${availableMessages[i].time})</span> <strong>${availableMessages[i].from}</strong> reservadamente para <strong>${availableMessages[i].to}:</strong> ${availableMessages[i].text}`;

        }

        messagesContainer.innerHTML += `
            <div class="message-item ${messageClass}">
                <p><span class="message-time">${messageContent}</p>
            </div>
        `;

    }

    // usado para manter a tela de load até que as mensagens sejam renderizadas da primeira vez.
    if(firstLoad){
        loginScreen.classList.add('hidden');
        loginActions.classList.remove('hidden');
        appScreen.classList.remove('hidden');
        firstLoad = false;
    }

    if(availableMessages.length > 0){
        messagesContainer.querySelector('.message-item:last-child').scrollIntoView();
    }

}

function initInputs(){

    sendMessageBtn.addEventListener('click', () => sendMessage(loggedUser.name, 'Todos', 'message', messageInput.value));

    messageInput.addEventListener('keyup', e=>{

        if(e.key.toLowerCase() === 'enter') {
            sendMessageBtn.click();
        }

    });

}

function sendMessage(from, to, type, text){

    const message = {
        from,
        to,
        type,
        text
    };

    axios.post('https://mock-api.driven.com.br/api/v6/uol/messages', message).then(response=>{

        loadMessages();
        messageInput.value = '';

    }).catch(err=>{
        console.log(err);
        alert('Ocorre um erro desconhecido. Tente novamente.');
        unknownError();
    });

}

window.onload = initLogin();