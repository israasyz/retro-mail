document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelectorAll('.inbox').forEach(element => {
    element.addEventListener('click', () => load_mailbox('inbox'))
  });
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelectorAll('.compose').forEach(element => {
    element.addEventListener('click', () => compose_email())
  });

  // Email form submission 
  document.querySelector('#compose-form').addEventListener('submit', (event) => {

    event.preventDefault();
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        const recipients = document.querySelector('#compose-recipients').value; 
        // Print result
        if("message" in result) {
          load_mailbox('sent');
        } else if(result["error"] === "At least one recipient required.") {
          alert(`The address in the "To" is a required field. Please provide a recipient address.`);
        } else if(result["error"] === `User with email ${recipients} does not exist.`) {
          alert(`The address "${recipients}" in the "To" field was not recognized. Please make sure that all addresses are properly formed.`);
        } 
    });
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(sender = '', subject = '', body = '', timestamp = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out or fill the composition fields
  document.querySelector('#compose-recipients').value = sender;
  document.querySelector('#compose-subject').value = subject?subject.startsWith('Re: ')?subject:'Re: '+subject:'';
  document.querySelector('#compose-body').value = timestamp?`On ${timestamp} ${sender} wrote:\n ${body}\n--------\n`:'';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<p class="mailbox__title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</p>
                                                      <div class="table-outer">
                                                      <div class="table-wrapper"> 
                                                          <table>
                                                            <colgroup>
                                                              <col width="30">
                                                              <col>
                                                              <col>
                                                              <col>
                                                            </colgroup>
                                                            <thead><tr>
                                                              <td><span class="table-head-img"></span><span class="big-separator"></span></td>
                                                              <td>From<span class="big-separator"></span></td>
                                                              <td>Subject<span class="big-separator"></span></td>
                                                              <td>Received</td>
                                                          </tr></thead><tbody></tbody></table>
                                                       </div></div>`;

  // Show the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const email_row = document.createElement('tr');
      if(email.read) {
        email_row.innerHTML = `<td><span class="read-email"></span></td>`;
      } else {
        email_row.innerHTML = `<td><span class="unread-email"></span></td>`;
      }
      email_row.innerHTML += `<td>${email.sender}</td><td>${email.subject}</td><td>${email.timestamp}</td>`;
      email_row.className = "emails";
      email_row.addEventListener('click', function() {
        load_email(mailbox, email.id);
      });
      email_row.style.backgroundColor = email.read?"#BEBEBE":"white";
      email_row.style.cursor = "pointer";
      // email_row.style.fontWeight = email.read?"normal":"bold";
      
      document.querySelector('#emails-view table tbody').append(email_row);
    });
      
  });

}

function load_email(mailbox, id){

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Clear out the view
  document.querySelector('#email-view').innerHTML = '';

  // Get the email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const email_info = document.createElement('div');
    email_info.className = "row email-info";

    const email_from = document.createElement('div');
    email_from.className = "col";
    email_from.innerHTML = `<b>From:&nbsp;&nbsp;</b> ${email.sender}`
    
    const email_to = document.createElement('div');
    email_to.className = "col";
    email_to.innerHTML = `<b>To:&nbsp;&nbsp;</b> ${email.recipients}`
    
    const email_subject = document.createElement('div');
    email_subject.className = "col";
    email_subject.innerHTML = `<b>Subject:&nbsp;&nbsp;</b> ${email.subject}`

    const email_timestamp = document.createElement('div');
    email_timestamp.className = "col";
    email_timestamp.innerHTML = `<b>Received:&nbsp;&nbsp;</b> ${email.timestamp}`

    const line_breaker1 = document.createElement('div');
    line_breaker1.className = "w-100";
    const line_breaker2 = document.createElement('div');
    line_breaker2.className = "w-100";

    email_info.append(email_from, email_to, line_breaker1, email_timestamp, line_breaker2, email_subject);

    const email_info_buttons = document.createElement('div');
    email_info_buttons.className = "email-info-buttons";

    const reply_btn = document.createElement('button');
    reply_btn.innerHTML = `<span class="reply-btn"></span>Reply`;
    reply_btn.addEventListener('click', () => compose_email(email.sender, email.subject, email.body, email.timestamp));
    
    email_info_buttons.append(reply_btn);
  
    if(mailbox === "inbox") {
      const archive_btn = document.createElement('button');
      archive_btn.innerHTML = `<span class="archive-btn"></span>Archive`;
      archive_btn.addEventListener('click', () => archive_email(id, true));
      email_info_buttons.append(archive_btn);
    } else if(mailbox === "archive") {
      const unarchive_btn = document.createElement('button');
      unarchive_btn.innerHTML = `<span class="to-inbox-btn"></span>Move to inbox`;
      unarchive_btn.addEventListener('click', () => archive_email(id, false));
      email_info_buttons.append(unarchive_btn);
    }

    const email_body = document.createElement('div');
    email_body.className = "email-body";
    email_body.innerText = `${email.body}`

    
    document.querySelector('#email-view').append(email_info, email_info_buttons, email_body);
  });

  // Mark the email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function archive_email(id, value) {

  // Mark the email as archived/unarchived
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: value
    })
  })  
  .then(() => load_mailbox('inbox'));
}