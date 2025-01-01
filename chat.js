const peer = new Peer();
        const connections = {};
        const userList = document.getElementById('user-list');
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('message-input');
        const profilePopup = document.getElementById('profile-popup');
        const loadingPopup = document.getElementById('loading-popup');
        const peerInputContainer = document.getElementById('peer-input-container');
        const exitChatBtn = document.getElementById('exit-chat-btn');
        const fileInput = document.getElementById('file-input');
        let userName = '';
        let userProfilePic = '';
        let userNumber = '';
        let isConnecting = false;
        let connectionTimeout;
        const profileIcon = document.getElementById('profile-icon');
        const profileMenu = document.getElementById('profile-menu');
        const profileImage = document.getElementById('profile-image');
        const profileNameInput = document.getElementById('profile-name');
        const profilePictureInput = document.getElementById('profile-picture');
        const profilePreview = document.getElementById('profile-preview');
        const previewImage = document.getElementById('preview-image');




        function generateUserNumber() {
            return 'UN' + Math.random().toString(36).substr(2, 9);
        }

        function saveUserData() {
            localStorage.setItem('userName', userName);
            localStorage.setItem('userProfilePic', userProfilePic);
            localStorage.setItem('userNumber', userNumber);
        }

        function loadUserData() {
            userName = localStorage.getItem('userName') || '';
            userProfilePic = localStorage.getItem('userProfilePic') || '';
            userNumber = localStorage.getItem('userNumber') || generateUserNumber();
            if (!userName || !userProfilePic) {
                profilePopup.style.display = 'flex';
            } else {
                saveUserData();
            }
        }



        const wallpaperOptions = [
            { name: 'Default', image: 'wall.jpg' },
            { name: 'Nature', image: 'wall2.jpg' },
            { name: 'City', image: 'wall3.jpg' },
            { name: 'Abstract', image: 'wall4.jpg' },
            { name: 'Abstract', image: 'wall5.avif' },
                { name: 'Abstract', image: 'wall6.jpg' },
            { name: 'Space', image: 'wall7.jpg' },
                { name: 'Abstract', image: 'wall1.jpg' },
        ];

        const wallpaperContainer = document.getElementById('wallpaper-options');
        let selectedWallpaper = '';
        let sentMessageColor = '#4a90e2';
        let receivedMessageColor = '#50c878';




        function createWallpaperOptions() {
            wallpaperOptions.forEach((wallpaper, index) => {
                const option = document.createElement('div');
                option.className = 'wallpaper-option';
                option.style.backgroundImage = `url('${wallpaper.image}')`;
                option.setAttribute('data-wallpaper', wallpaper.image);
                option.title = wallpaper.name;
                option.onclick = () => selectWallpaper(index);
                wallpaperContainer.appendChild(option);
            });
        }

        function selectWallpaper(index) {
            const options = wallpaperContainer.getElementsByClassName('wallpaper-option');
            for (let option of options) {
                option.classList.remove('selected');
            }
            options[index].classList.add('selected');
            selectedWallpaper = wallpaperOptions[index];
        }





        /*======================================================*/

        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    profilePreview.textContent = '';
                };
                reader.readAsDataURL(file);
            }
        });

        profileNameInput.addEventListener('input', () => {
            const name = profileNameInput.value.trim();
            if (name) {
                if (!profilePictureInput.files[0] && !userProfilePic) {
                    profilePreview.textContent = name.charAt(0).toUpperCase();
                    previewImage.style.display = 'none';
                }
            } else {
                if (!profilePictureInput.files[0] && !userProfilePic) {
                    profilePreview.textContent = 'A';
                    previewImage.style.display = 'none';
                }
            }
        });


        profileIcon.addEventListener('click', () => {
            profileMenu.classList.toggle('active');
        });

        function updateProfile() {
            const newName = profileNameInput.value.trim();
            const newPicture = profilePictureInput.files[0];

            if (newName) {
                userName = newName;
                localStorage.setItem('userName', userName);
            }

            if (newPicture) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userProfilePic = e.target.result;
                    localStorage.setItem('userProfilePic', userProfilePic);
                    profileImage.src = userProfilePic;
                };
                reader.readAsDataURL(newPicture);
            }


            if (selectedWallpaper) {
                localStorage.setItem('chatWallpaper', JSON.stringify(selectedWallpaper));
            }

            sentMessageColor = document.getElementById('sent-color').value;
            receivedMessageColor = document.getElementById('received-color').value;
            localStorage.setItem('sentMessageColor', sentMessageColor);
            localStorage.setItem('receivedMessageColor', receivedMessageColor);

            applyWallpaperAndColors();
            //============================

            profileMenu.classList.remove('active');
            updateUserList();
            
            // Notify other peers about the profile update
            Object.values(connections).forEach(conn => {
                conn.send({type: 'profile', name: userName, profilePic: userProfilePic});
            });
        }



        function applyWallpaperAndColors() {
            const chatMessages = document.querySelector('.chat-messages');
            chatMessages.style.backgroundImage = `url('${selectedWallpaper.image}')`;
            
            document.documentElement.style.setProperty('--sent-message-color', sentMessageColor);
            document.documentElement.style.setProperty('--sent-message-text-color', getContrastColor(sentMessageColor));
            document.documentElement.style.setProperty('--received-message-color', receivedMessageColor);
            document.documentElement.style.setProperty('--received-message-text-color', getContrastColor(receivedMessageColor));

            // Update existing messages
            document.querySelectorAll('.sent .message').forEach(msg => {
                msg.style.backgroundColor = sentMessageColor;
                msg.style.color = getContrastColor(sentMessageColor);
            });
            document.querySelectorAll('.received .message').forEach(msg => {
                msg.style.backgroundColor = receivedMessageColor;
                msg.style.color = getContrastColor(receivedMessageColor);
            });
        }


        function getContrastColor(hexcolor) {
            // Convert hex to RGB
            const r = parseInt(hexcolor.substr(1,2),16);
            const g = parseInt(hexcolor.substr(3,2),16);
            const b = parseInt(hexcolor.substr(5,2),16);
            // Calculate luminance
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            // Return black or white depending on luminance
            return (yiq >= 128) ? 'black' : 'white';
        }

        // Load user profile on startup
        function loadUserProfile() {
            userName = localStorage.getItem('userName') || 'Anonymous';
            userProfilePic = localStorage.getItem('userProfilePic');
            
            profileNameInput.value = userName;
            if (userProfilePic) {
                profileImage.src = userProfilePic;
                previewImage.src = userProfilePic;
                previewImage.style.display = 'block';
            } else {
                profilePreview.textContent = userName.charAt(0).toUpperCase();
                previewImage.style.display = 'none';
            }
        }


        const savedWallpaper = localStorage.getItem('chatWallpaper');
            sentMessageColor = localStorage.getItem('sentMessageColor') || '#4a90e2';
            receivedMessageColor = localStorage.getItem('receivedMessageColor') || '#50c878';
            
            document.getElementById('sent-color').value = sentMessageColor;
            document.getElementById('received-color').value = receivedMessageColor;

            createWallpaperOptions();
            if (savedWallpaper) {
                selectedWallpaper = JSON.parse(savedWallpaper);
                const selectedIndex = wallpaperOptions.findIndex(w => w.name === selectedWallpaper.name);
                if (selectedIndex !== -1) {
                    selectWallpaper(selectedIndex);
                }
            } else {
                selectWallpaper(0); // Select default wallpaper
            }
            applyWallpaperAndColors();

        // Call this function when the page loads
        loadUserProfile();




        peer.on('open', (id) => {
            console.log('Peer opened with ID:', id);
            document.getElementById('peer-id').textContent = id;
            checkUserProfile();
        });

        peer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);
            setupConnection(conn);
        });;

        function checkUserProfile() {
            userName = localStorage.getItem('userName');
            userProfilePic = localStorage.getItem('userProfilePic');
            if (!userName || !userProfilePic) {
                profilePopup.style.display = 'flex';
            }
        }

        function saveProfile() {
            userName = document.getElementById('name-input').value.trim();
            const profilePicInput = document.getElementById('profile-pic-input');
            
            if (userName && profilePicInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userProfilePic = e.target.result;
                    saveUserData();
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userProfilePic', userProfilePic);
                    profilePopup.style.display = 'none';
                    updateUserList();
                };
                reader.readAsDataURL(profilePicInput.files[0]);
            } else {
                alert('Please enter your name and select a profile picture.');
            }
        }

        function copyPeerId() {
            const peerId = document.getElementById('peer-id').textContent;
            
            // Create a temporary textarea element
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = peerId;
            
            // Make the textarea out of viewport
            tempTextArea.style.position = 'fixed';
            tempTextArea.style.left = '-999999px';
            tempTextArea.style.top = '-999999px';
            document.body.appendChild(tempTextArea);
            
            // Select and copy the text
            tempTextArea.focus();
            tempTextArea.select();
            
            let succeeded;
            try {
                succeeded = document.execCommand('copy');
            } catch (err) {
                succeeded = false;
            }
            
            // Remove the temporary element
            document.body.removeChild(tempTextArea);
            
            // Provide user feedback
            if (succeeded) {
                alert('Peer ID copied to clipboard!');
            } else {
                alert('Failed to copy Peer ID. Please copy it manually.');
            }
        }

        function connectToPeer() {
            const peerId = document.getElementById('peer-id-input').value;
            if (peerId && !isConnecting) {
                console.log('Attempting to connect to:', peerId);
                isConnecting = true;
                loadingPopup.style.display = 'flex';
                const conn = peer.connect(peerId);
                
                setupConnection(conn);

                // Set a timeout to stop the connection attempt after 10 seconds
                connectionTimeout = setTimeout(() => {
                    if (isConnecting) {
                        console.log('Connection attempt timed out');
                        conn.close();
                        hideLoadingPopup();
                        alert('Connection timed out. Please try again.');
                    }
                }, 10000);
            }
        }


        function hideLoadingPopup() {
            console.log('Hiding loading popup');
            isConnecting = false;
            loadingPopup.style.display = 'none';
            clearTimeout(connectionTimeout);
        }

        function setupConnection(conn) {
            console.log('Setting up connection for:', conn.peer);

            conn.on('open', () => {
                console.log('Connection opened with:', conn.peer);
                hideLoadingPopup();
                connections[conn.peer] = conn;
                conn.send({type: 'profile', name: userName, profilePic: userProfilePic});
                updateUserList();
                loadPreviousChat(conn.peer);
                addMessage('System', `Connected to ${conn.peer}`, 'system');
                
                exitChatBtn.style.display = 'block';
                
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                hideLoadingPopup();
                delete connections[conn.peer];
                updateUserList();
                addMessage('System', `Failed to connect to ${conn.peer}`, 'system');
            });

            conn.on('data', (data) => {
                console.log('Received data from:', conn.peer, data);
                if (data.type === 'profile') {
                    connections[conn.peer].name = data.name;
                    connections[conn.peer].profilePic = data.profilePic;
                    connections[conn.peer].userNumber = data.userNumber;
                    updateUserList();
                    loadPreviousChat(conn.peer);
                } else if (data.type === 'file') {
                    const blob = new Blob([data.file], {type: data.fileType});
                    const url = URL.createObjectURL(blob);
                    addFileMessage(connections[conn.peer].name || conn.peer, url, data.fileType, 'received', connections[conn.peer].profilePic);
                    saveChatMessage(conn.peer, {type: 'file', url: url, fileType: data.fileType, sender: connections[conn.peer].name || conn.peer});
                } else {
                    addMessage(connections[conn.peer].name || conn.peer, data, 'received', connections[conn.peer].profilePic);
                    saveChatMessage(conn.peer, {type: 'text', content: data, sender: connections[conn.peer].name || conn.peer});
                }
            });

            conn.on('close', () => {
                console.log('Connection closed with:', conn.peer);
                const disconnectedUser = connections[conn.peer]?.name || conn.peer;
                delete connections[conn.peer];
                updateUserList();
                if (Object.keys(connections).length >= 3) {
                    addNotification(`${disconnectedUser} left the chat`);
                } else {
                    addMessage('System', `Disconnected from ${disconnectedUser}`, 'system');
                }
                if (Object.keys(connections).length === 0) {
                    peerInputContainer.style.display = 'flex';
                    exitChatBtn.style.display = 'none';
                }
            });

        }



        function sendMessage() {
            const message = messageInput.value;
            if (message) {
                console.log('Sending message:', message);
                addMessage('You', message, 'sent', userProfilePic);
                for (let peerId in connections) {
                    connections[peerId].send(message);
                    saveChatMessage(peerId, {type: 'text', content: message, sender: userName});
                }
                messageInput.value = '';
            }
        }


        function loadPreviousChat(peerId) {
            const chatHistory = JSON.parse(localStorage.getItem(`chat_${connections[peerId].userNumber}`)) || [];
            chatHistory.forEach(msg => {
                if (msg.type === 'text') {
                    addMessage(msg.sender, msg.content, msg.sender === userName ? 'sent' : 'received', msg.sender === userName ? userProfilePic : connections[peerId].profilePic);
                } else if (msg.type === 'file') {
                    addFileMessage(msg.sender, msg.url, msg.fileType, msg.sender === userName ? 'sent' : 'received', msg.sender === userName ? userProfilePic : connections[peerId].profilePic);
                }
            });
        }

        function updateUserList() {
            userList.innerHTML = `
                <h3>Connected Users</h3>
                <div class="close-connect">
                    <button onclick="toggleMenu()" class="close">X</button>
                </div>
            `;
            Object.values(connections).forEach(conn => {
                const userElement = document.createElement('div');
                userElement.innerHTML = `
                    <div class="user-profile">
                        ${conn.profilePic ? `<img src="${conn.profilePic}" alt="${conn.name}">` : conn.name.charAt(0).toUpperCase()}
                    </div>
                    <span>${conn.name || conn.peer}</span>
                `;
                userList.appendChild(userElement);
            });
        }


        function addNotification(message) {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification';
            notificationElement.textContent = message;
            messages.appendChild(notificationElement);
            messages.scrollTop = messages.scrollHeight;
        }


        function addFileMessage(sender, fileUrl, fileType, type, profilePic) {
            const messageContainer = document.createElement('div');
            messageContainer.className = `message-container ${type}`;

            const profileElement = document.createElement('div');
            profileElement.className = 'user-profile';
            if (profilePic) {
                profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
            } else {
                profileElement.textContent = sender.charAt(0).toUpperCase();
            }

            const messageElement = document.createElement('div');
            messageElement.className = 'message';

            if (fileType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = fileUrl;
                img.className = 'image-message';
                messageElement.appendChild(img);
            } else if (fileType.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = fileUrl;
                video.className = 'video-message';
                video.controls = true;
                messageElement.appendChild(video);
            }

            if (type === 'sent') {
                messageContainer.appendChild(messageElement);
                messageContainer.appendChild(profileElement);
            } else {
                messageContainer.appendChild(profileElement);
                messageContainer.appendChild(messageElement);
            }

            messages.appendChild(messageContainer);
            messages.scrollTop = messages.scrollHeight;
        }

        function addMessage(sender, message, type, profilePic) {
            const messageContainer = document.createElement('div');
            messageContainer.className = `message-container ${type}`;

            const profileElement = document.createElement('div');
            profileElement.className = 'user-profile';
            if (profilePic) {
                profileElement.innerHTML = `<img src="${profilePic}" alt="${sender}">`;
            } else {
                profileElement.textContent = sender.charAt(0).toUpperCase();
            }

            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;

            if (type === 'sent') {
                messageContainer.appendChild(messageElement);
                messageContainer.appendChild(profileElement);
                messageElement.style.backgroundColor = 'var(--sent-message-color)';
                messageElement.style.color = 'var(--sent-message-text-color)';
            } else if (type === 'received') {
                messageContainer.appendChild(profileElement);
                messageContainer.appendChild(messageElement);
                messageElement.style.backgroundColor = 'var(--received-message-color)';
                messageElement.style.color = 'var(--received-message-text-color)';
            } else {
                messageElement.style.backgroundColor = '#999';
                messageContainer.style.justifyContent = 'center';
                messageContainer.appendChild(messageElement);
                messageElement.style.backgroundColor = '#999';
                messageElement.style.color = '#fff';
            }

            messages.appendChild(messageContainer);
            messages.scrollTop = messages.scrollHeight;
        }

        function sendMessage() {
            const message = messageInput.value;
            if (message) {
                console.log('Sending message:', message);
                addMessage('You', message, 'sent', userProfilePic);
                for (let peerId in connections) {
                    connections[peerId].send(message);
                }
                messageInput.value = '';
            }
        }




        function toggleMenu() {
            userList.classList.toggle('open');
        }

        function exitChat() {
            console.log('Exiting chat');
            Object.values(connections).forEach(conn => conn.close());
            connections = {};
            updateUserList();
            peerInputContainer.style.display = 'flex';
            exitChatBtn.style.display = 'none';
            addMessage('System', 'You have left the chat', 'system');
        }

        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileData = new Uint8Array(e.target.result);
                    const fileUrl = URL.createObjectURL(new Blob([fileData], {type: file.type}));
                    addFileMessage('You', fileUrl, file.type, 'sent', userProfilePic);
                    for (let peerId in connections) {
                        connections[peerId].send({type: 'file', file: fileData, fileType: file.type});
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });
        

        loadUserData();



/*================================================new records====================================================*/
const alertPopup2 = document.getElementById('alertPopup2');
const overlay2 = document.getElementById('overlay2');

// Function to show alert and hide content
function showAlert2() {
    alertPopup2.style.display = 'block';
    overlay2.style.display = 'block';
    messages.style.display = 'none'; // Hide the content

    // Hide the alert and content after 5 seconds
    setTimeout(() => {
        alertPopup2.style.display = 'none';
        overlay2.style.display = 'none';
        messages.style.display = 'block'; // Show the content again
    }, 1000); // Adjusted timeout value to 1000ms (1 seconds)
}

// Track touches
let touchStartCount = 0;

// When touch starts (first touch), reset count
document.addEventListener('touchstart', (e) => {
    touchStartCount = e.touches.length;
    console.log('touchstart - Touch count:', touchStartCount); // Debugging log
    if (touchStartCount > 2) {
        console.log('More than 2 touches, triggering alert');
        showAlert2(); // Trigger alert if more than 2 touches
    }
});

// When touch moves, check the number of active touches
document.addEventListener('touchmove', (e) => {
    touchStartCount = e.touches.length;
    console.log('touchmove - Touch count:', touchStartCount); // Debugging log
    if (touchStartCount > 2) {
        console.log('More than 2 touches, triggering alert');
        showAlert2(); // Trigger alert if more than 2 touches
    }
});

// When touch ends, reset the touch count
document.addEventListener('touchend', () => {
    touchStartCount = 0;
    console.log('touchend - Touch count reset:', touchStartCount); // Debugging log
});

// // Disable right-click (context menu)
// document.addEventListener('contextmenu', (e) => {
//     e.preventDefault(); // Disable right-click menu
//     showAlert2();
// });

// Prevent text selection
document.addEventListener('selectstart', (e) => {
    e.preventDefault(); // Prevent text selection
});
