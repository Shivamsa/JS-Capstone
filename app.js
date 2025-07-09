let currentUser = null;

const sections = {
    login: document.getElementById("login-section"),
    signup: document.getElementById("signup-section"),
    dashboard: document.getElementById("dashboard-section"),
    tasks: document.getElementById("tasks-section"),
    notes: document.getElementById("notes-section")
};

function renderHeader() {
    const userInfo = document.getElementById("user-info");
    const logoutButton = document.getElementById("logout-btn");
    const desktopNavLinks = document.getElementById("desktop-nav");

    if (currentUser) {
        userInfo.textContent = "";
        logoutButton.style.display = "inline";
        desktopNavLinks.querySelector("#nav-dashboard").style.display = "inline";
        desktopNavLinks.querySelector("#nav-tasks").style.display = "inline";
        desktopNavLinks.querySelector("#nav-notes").style.display = "inline";
    } else {
        userInfo.textContent = "";
        logoutButton.style.display = "none";
        desktopNavLinks.querySelector("#nav-dashboard").style.display = "none";
        desktopNavLinks.querySelector("#nav-tasks").style.display = "none";
        desktopNavLinks.querySelector("#nav-notes").style.display = "none";        
    }

    //Implement Logout button
    logoutButton.addEventListener("click",()=>{
        localStorage.removeItem('user');
        window.location.hash = "#login";
        currentUser = null;
        route();
    })
}

renderHeader();

async function initialize() {
    const signupform = document.getElementById("signup-form");

    signupform.addEventListener("submit", async (event) => {
        event.preventDefault(); // prevents default behaviour
        const username = document.getElementById("signup-username").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        //Creating an entry
        // currentUser={
        //     id:Date.now(),
        //     username,
        //     email,
        //     password
        // }

        // localStorage.setItem("user",JSON.stringify(currentUser));//whenever we store data in local storage ,it has to be i string format.


        try {
            const res = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (data.length > 0) {
                throw new Error("Email Exists");
            }

            const createuser = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const createduser=await createuser.json();
            console.log(createduser)
            currentUser=createduser;

            //Saving the data to the local storage
            localStorage.setItem("user",JSON.stringify(currentUser));

            //show dashboard
            window.location.hash="dashboard";
            route();


        } catch (err) {
            console.log(err);
            document.getElementById("signup-errors").textContent = err.message;
        }
    });

    const loginform = document.getElementById("login-form");

    loginform.addEventListener("submit",async(event)=>{
        event.preventDefault(); 
        
        const email=document.getElementById("login-email").value;
        const password=document.getElementById("login-password").value;

        try{
            const res= await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
            const data =await res.json();
            console.log(data);

            if(data.length === 0)
            {
                throw new Error("Invalid Credentials !")
            }

            const user=data.find(item=>item.password === password);
            currentUser=user;
            console.log(user);
            localStorage.setItem("user",JSON.stringify(currentUser));
            window.location.hash="dashboard";
            route(); 

        }catch(err){
            console.log(err);
            document.getElementById("login-errors").textContent=err.message; 
        }


    });

    //Default handler
    currentUser = localStorage.getItem("user");
    route();

    window.onhashchange=route; // this will store the function reference of route and will called when we start for the first time.
    


}

initialize();

function route() {
    const hash = window.location.hash || "#";
    renderHeader();

    if (currentUser) {
        const page = hash.substring(1) || "dashboard";
        showsection(page);
        switch (page) {
            case "dashboard":
                renderDashboard();
                break;
            case "tasks":
                //renderTasks();
                break;
            case "notes":
                rendernotes();
                break;
            default:
                renderDashboard();
        }

    } else {
        if (hash === "#signup") {
            showsection("signup");
        } else {
            showsection("login");
        }
    }
}

function showsection(name){

    // remove the display:block property from each section
    const value=Object.values(sections)
    console.log(value);
    value.forEach((item) => {
        console.log(item)
        item.classList.remove('active');
        console.log(item)
    });

    //Only add active property to current visible section
    if(sections[name]){
        sections[name].classList.add('active');
    }
}

function renderDashboard(){                    //we use backtick(``) to dynamically inject variables.
    sections.dashboard.innerHTML=`                                            
        <h2> Welcome to the Dashboard</h2>${JSON.parse(currentUser).username} !
        <p>Choose either task or notes to get starte</p>
    `;
    
    setActiveNavLink();
}

function setActiveNavLink(){
    const hash=window.location.hash || "#dashboard";
    
    const navLinks = {
        dashboard: document.getElementById("nav-dashboard"),
        tasks: document.getElementById("nav-tasks"),
        notes: document.getElementById("nav-notes")
    }

    const navData=Object.values(navLinks);
    navData.forEach((item)=>{
        item.classList.remove("active");
        if(hash.includes(item.getAttribute("href"))){
            item.classList.add("active");
        }
    })
}

function renderTasks(){
    let user = [];
    let tasks = [];

    Promise.all([
        fetch(`http://localhost:3000/users`).then(res => res.json()),
        fetch(`http://localhost:3000/tasks?userId=${currentUser.id}`).then(res => res.json())
    ]).then(([fetcheduser,fetchedtask]) => {
        users=fetcheduser;
        tasks=fetchedtask;
    })
    .catch((err)=>console.log("Some Error"))

    const addtaskbutton = document.getElementById("add-task-btn");

    addtaskbutton.addEventListener("click",()=>{
        const modal = document.getElementById("task-modal");
        const form = document.getElementById("add-task-form");

        modal.style.display="flex";
        form.addEventListener("submit",async (event)=>{
            event.preventDefault();
            const newTask ={
                userId: currentUser.id,
                title: document.getElementById("task-title").value,
                description: document.getElementById("task-desc").value,
                priority: document.getElementById("task-priority").value,
                color: document.getElementById("task-color").value,
                createdAt: new Date().toISOString()
            };

            await addTask(newTask)
        });

        //After the data store in the server, now storing in local storage.
        async function addTask(task){
            const savedtask= syncTaskToServer(task);
            if(savedtask){
                tasks.push(savedtask);
                let storageTask = [...tasks] //Spread operator 
                localStorage.setItem('tasks',JSON.stringify(storageTask))
            }
        }
        
        // Initially we are saving the data to server then we are storing in local storage.
        async function syncTaskToServer(task){
            try{
                const res = await fetch(`http://localhost:3000/tasks`,{
                    method:"POST",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify(task)
                })

                return await res.json();
            }catch(err){
                console.log("Failed to store in server",err);
                return null;
            }
        }

    })
}

renderTasks();