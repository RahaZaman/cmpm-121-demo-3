// Create a button element
const button = document.createElement("button");
button.textContent = "Click me";

// Add an event listener to the button
button.addEventListener("click", () => {
  alert("You clicked the button!");
});

// Append the button the body of the element
document.body.appendChild(button);
