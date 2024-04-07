const searchSection = document.getElementById("searchSection");
const navSection = document.getElementById("navLink_links");
const showmenuIcon = document.getElementById("showmenu_icon");
const hidemenuIcon = document.getElementById("hidemenu_icon");
let profileDropdown = document.querySelector(".profile-dropdown-list");
let Dropdown_btn = document.querySelector(".profile_img_name");

function showsearch(){
   searchSection.style.display="flex";

}

function hidesearch(){
   searchSection.style.display="none";
  
}


function showmenu(){
   navSection.style.right="0px";
   showmenuIcon.style.display="none"
   hidemenuIcon.style.display="block";
}

function hidemenu(){
   navSection.style.right="-200px";
   showmenuIcon.style.display="block"
   hidemenuIcon.style.display="none";
}

const toggle = ()=>profileDropdown.classList.toggle('active');

window.addEventListener('click',function(e){
   if(!Dropdown_btn.contains(e.target))profileDropdown.classList.remove('active');
});