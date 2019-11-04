// Handle clicking mailbox link
document.querySelectorAll("#mailboxes > .mailbox-link").forEach(e => {
  e.addEventListener("click", () => {
    switch (e.dataset.mailbox) {
      case "Inbox":
        showInbox();
        break;
      case "Important":
        showImportant();
        break;
      case "Sent":
        showSent();
        break;
      case "Trash":
        showTrash();
        break;
    }
    Array.from(e.parentNode.children).forEach(ele => {
      if (ele == e) {
        ele.classList.add("clicked");
        ele.classList.remove("not-clicked");
      } else {
        ele.classList.remove("clicked");
        ele.classList.add("not-clicked");
      }
    });
  });
});

document.getElementById("compose").onclick = onCompose;
document.getElementById("back").onclick = onBack;
document.getElementById("forward").onclick = onForward;

function showInbox() {
  fetchEmailRows("Inbox");
}

function showImportant() {
  fetchEmailRows("Important");
}

function showSent() {
  fetchEmailRows("Sent");
}

function showTrash() {
  fetchEmailRows("Trash");
}

async function showContent(id) {
  const mail = await (await fetch(`/getemail?id=${id}`)).json();
  const { sender, recipient, title, time, content, mailbox } = mail;
  document.getElementById("emails").innerHTML = `
<div class="row space-between">
  <div>${title}</div>
  <div>${time}</div>
</div>
<div>${sender}</div>
<div>${recipient}</div>
<div>${content}</div>
  `;

  document.getElementById("emails").dataset.currentPage = "content";
  document.getElementById("emails").dataset.id = id;
}

function onCompose() {
  document.getElementById("emails").innerHTML = `
<div>New Message</div>
<div>
  <label for="to">To: </label>
  <input id="to"/>
</div>
<div>
  <label for="subject">Subject: </label>
  <input id="subject"/>
</div>
<div>
  <textarea id="content"></textarea>
</div>
<div>
  <button id="send-compose">Send</button>
</div>
  `;
  document.getElementById("send-compose").onclick = async () => {
    const to = document.getElementById("to").value;
    const subject = document.getElementById("subject").value;
    const content = document.getElementById("content").value;

    const res = await fetch("/sendemail", {
      method: "POST",
      body: JSON.stringify({ to, subject, content }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      document
        .querySelector('#mailboxes > button[data-mailbox="Sent"]')
        .click();
    }
  };
}

async function onMoveTo(mailbox) {
  if (document.getElementById("emails").dataset.currentPage === "compose") {
    return;
  }
  let ids;
  if (document.getElementById("emails").dataset.currentPage === "list") {
    ids = Array.from(
      document.getElementsByClassName("email-row-checkbox")
    ).reduce((acc, ele) => (ele.checked ? [...acc, ele.dataset.id] : acc), []);
  } else if (
    document.getElementById("emails").dataset.currentPage === "content"
  ) {
    ids = [document.getElementById("emails").dataset.id];
  } else {
    return;
  }

  await fetch("/changemailbox", {
    method: "POST",
    body: JSON.stringify({ ids, mailbox }),
    headers: { "Content-Type": "application/json" }
  });

  if (document.getElementById("emails").dataset.currentPage === "list") {
    await fetchEmailRows(document.getElementById("emails").dataset.mailbox);
  } else if (
    document.getElementById("emails").dataset.currentPage === "content"
  ) {
    await fetchEmailRows(document.getElementById("emails").dataset.mailbox);
  }
}

function onBack() {
  if (document.getElementById("emails").dataset.page <= 1) {
    document.getElementById("emails").dataset.page = 1;
    return;
  }
  document.getElementById("emails").dataset.page--;
  fetchEmailRows(document.getElementById("emails").dataset.mailbox);
}

function onForward() {
  document.getElementById("emails").dataset.page++;
  fetchEmailRows(document.getElementById("emails").dataset.mailbox);
}

function makeEmailRow({ id, name, title, time }) {
  return `
<div class="email-row" data-id="${id}">
  <input type="checkbox" data-id="${id}" class="email-row-checkbox"/>
  <span class="email-row-name">${name}</span>
  <span class="email-row-title">${title}</span>
  <span class="email-row-time">${time}</span>
</div>
  `;
}

function hydrateAllEmailRows() {
  Array.from(document.getElementsByClassName("email-row")).forEach(row => {
    const id = row.dataset.id;
    row.addEventListener("click", () => {
      showContent(id);
    });
    row.children[0].addEventListener("click", event => {
      event.cancelBubble = true;
      if (event.stopPropagation) {
        event.stopPropagation();
      }
    });
  });
}

async function fetchEmailRows(mailbox) {
  const page = document.getElementById("emails").dataset.page || 1;
  const res = await fetch(`/retrieveemaillist?mailbox=${mailbox}&page=${page}`);
  if (!res.ok) {
    return;
  }
  document.getElementById("emails").dataset.page = page;
  document.getElementById("emails").dataset.mailbox = mailbox;
  document.getElementById("emails").dataset.currentPage = "list";
  document.getElementById("emails").innerHTML = (await res.json())
    .map(makeEmailRow)
    .join("");
  hydrateAllEmailRows();
}

window.addEventListener("click", function(event) {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
});

// Init on run
showInbox();

function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}
