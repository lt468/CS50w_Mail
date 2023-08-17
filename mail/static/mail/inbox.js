document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email(email, isReply) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-singular-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
 
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    // Check to see if it's a reply
    if (isReply) {
        document.querySelector('#compose-recipients').value = `${email['recipients'].join(', ')}`
        document.querySelector('#compose-subject').value = email['subject'].startsWith('Re: ') ? email['subject'] : `Re: ${email['subject']}`;
        document.querySelector('#compose-body').value = `--- Original Message ---\nOn ${email['timestamp']}, ${email['sender']} wrote:\n${email['body']}`;
    } 

    // Define the event handler function
    function handleSubmit(event) {
        event.preventDefault(); // Prevent default form submission behavior

        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value,
            })
        })
        .then(response => response.json())
        .then(result => {
            // Then make them into a json object and then I should see the values printed out
            console.log(result);
            if (result['message'] === 'Email sent successfully.'){
                // Loads the sent mailbox and gives alert
                load_mailbox('sent');
            } else {
                // Otherwise error message
                alert(`Error. ${result['error']}`);
            }
        });
    }

    // Assign the event handler to the onsubmit property
    document.querySelector('#compose-form').onsubmit = handleSubmit;
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-singular-email').style.display = 'none';
    
    // Clear out the display of emails
    document.querySelector('#emails-view').innerHTML = '';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    

    // API call to /emails/<mailbox>
    // For each of the emails 
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            console.log(emails)
            emails.forEach(email => {
                display_emails(email, mailbox)
            });
        });
}

function display_emails(contents, mailbox) {

    // Create new email
    const email = document.createElement('div');

    // Check which class it should belong to depending on its read status
    if (contents["read"] === true) {
        email.classList.add('email-base', 'email-read');
    } else {
        email.classList.add('email-base', 'email');
    }
    
    // Gets the users email by accessing the innerHTML
    const my_email = document.getElementById('user_email').innerHTML 


    // First see if we're in the archive mailbox
    if (contents['archive'] === true){
        // Only will run if message is archived
        let recipients_text = contents['recipients'].length > 1 ? `<strong>${contents['recipients'][0]} + others</strong>` : `<strong>${contents['recipients'][0]}</strong>`;

        email.innerHTML = `
            <span><strong>${recipients_text}</strong> | ${contents['subject']}</span>
            <span class="date-time">${contents['timestamp']}</span>
            `;

    } else if (contents['recipients'].includes(my_email) && contents['recipients'].length === 1){
        // The received emails from me
        email.innerHTML = `
            <span><strong>me</strong> | ${contents['subject']}</span>
            <span class="date-time">${contents['timestamp']}</span>
            `;
    } else if (my_email === contents['sender']){
        // This is all the sent mail
        // Checking to see if the user had sent to more than one recipients
        let recipients_text = contents['recipients'].length > 1 ? `<strong>${contents['recipients'][0]} + others</strong>` : `<strong>${contents['recipients'][0]}</strong>`;

        email.innerHTML = `
            <span><strong>${recipients_text}</strong> | ${contents['subject']}</span>
            <span class="date-time">${contents['timestamp']}</span>
            `;
    } else {
        // Lastly it must have been received
        email.innerHTML = `
            <span><strong>${contents['sender']}</strong> | ${contents['subject']}</span>
            <span class="date-time">${contents['timestamp']}</span>
            `;
    }

    // Add email to the DOM
    document.querySelector('#emails-view').append(email);
    
    // Listen for if the user clicks on an email
    email.addEventListener('click', () => {
        fetch(`/emails/${contents['id']}`)
        .then(response => response.json())
        .then(email_content => {
            view_singular_email(email_content, mailbox)
        })
    });

}

// Function to display a button
function display_button(name, style){

    // Creating button
    const generic_button = document.createElement('button');

    // Adding ID to button
    generic_button.setAttribute('id', `${name}_button`);

    // Adding class to buttons
    generic_button.classList.add('btn', 'btn-sm', 'action_button', `btn-outline-${style}`);

    // Making the inner HTML
    generic_button.innerHTML = `${name}`;

    return generic_button

}

function updateEmailArchiveStatus(emailId, status) {
    return fetch(`/emails/${emailId}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: status
        })
    });
}

// Constructed the skeleton of the email view in the HTML and CSS file, JS populates it below
function view_singular_email(email_content, mailbox) {
    // Hide everything else but the singular email
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-singular-email').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Change the read status to true
    fetch(`/emails/${email_content['id']}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });

    document.querySelector('#st').innerHTML = `
    <strong>Subject: </strong>${email_content['subject']}
    <br>
    <strong>Timestamp: </strong>${email_content['timestamp']}
    `;

    document.querySelector('#tf').innerHTML = `
    <strong>To: </strong>${email_content['recipients'].join(', ')}
    <br>
    <strong>From: </strong>${email_content['sender']}
    `;
    
    // Clear existing content in action_buttons_box
    document.querySelector('#action_buttons_box').innerHTML = '';

    // Buttons common to all cases
    const replyButton = display_button('Reply', 'primary');
    document.querySelector('#action_buttons_box').appendChild(replyButton);
    replyButton.addEventListener('click', () => {
        compose_email(email_content, true);
    });

    // Check to see which mailbox this is being viewed in 
    switch (mailbox) {
        // Need a reply and an archive button
        case 'inbox':
            if (email_content['archived'] === false) {
                const archiveButton = display_button('Archive', 'success');
                document.querySelector('#action_buttons_box').appendChild(archiveButton);

                archiveButton.addEventListener('click', () => {
                    console.log('Archive button clicked');
                    updateEmailArchiveStatus(email_content['id'], true).then(() => {load_mailbox('inbox')});
                });
            } else {
                const unarchiveButton = display_button('Unarchive', 'danger');
                document.querySelector('#action_buttons_box').appendChild(unarchiveButton);

                unarchiveButton.addEventListener('click', () => {
                    console.log('Unarchive button clicked');
                    updateEmailArchiveStatus(email_content['id'], false).then(() => {load_mailbox('inbox')});
                });
            }
            break;

        case 'archive':
            const unarchiveButton = display_button('Unarchive', 'danger');
            document.querySelector('#action_buttons_box').appendChild(unarchiveButton);

            unarchiveButton.addEventListener('click', () => {
                console.log('Unarchive button clicked');
                updateEmailArchiveStatus(email_content['id'], false).then(() => {load_mailbox('inbox')});
            });
            break;
    }

    document.querySelector('#body').innerHTML = `${email_content['body']}`;
}

