var Button = function(title, callback, options) {
  var color;
  var btn = document.createElement("button");
  btn.style.border = "0px solid transparent";
  btn.style.borderRadius = ".25rem";
  btn.style.outline = "none";
  btn.style.margin = "0 5px";
  btn.onclick = callback;
  btn.innerText = title;
  applyStyle(btn, TextStyle);
  
  // Hover Options
  if (options && options.hover) {
    btn.onmouseover = function() {
      color = btn.style.backgroundColor;
      btn.style.backgroundColor = options.hover;
    }
    btn.onmouseout = function() {
      btn.style.backgroundColor = color;
    }
  }
  
  return btn;
}

var Input = function() {
  var input = document.createElement("input");
  applyStyle(input, TextStyle);
  applyStyle(input, InputStyle);
  
  return {
    element: input
  }
}

var ShareLink = function(url) {
  var container = document.createElement("div");
  
  applyStyle(container, CenterContents);
  
  var input = (new Input()).element;
  input.value = url;
  var copy = new Button("Copy invite", function() {
    input.select();
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    Notification.show("Copied! Send that link to a friend to get started!");
  });
  
  container.appendChild(input);
  container.appendChild(copy);
  
  return {
    element: container,
    api: {
      updateUrl: function(url) {
        input.value = url;
      }
    }
  };
}

var Panel = function() {
  var panel = document.createElement("div");
  applyStyle(panel, CardStyle);
  return panel;
  //panel.styl
}

var CardStyle = {
  backgroundColor: "white",
  boxShadow: "0 1px 4px rgba(0,0,0,.15)"
};

var TextStyle = {
  fontFamily: "Consolas,monaco,\"Ubuntu Mono\",courier,monospace",
  fontWeight: 300
};

var InputStyle = {
  border: "0",
  margin: "10px",
  width: "90%",
  background: "whitesmoke",
  padding: "10px",
  borderRadius: "100px",
  textAlign: "center",
  outline: "none"
};

var CenterContents = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

function applyStyle(target, style) {
  Object.assign(target.style, style);
}

var Notification = function() {
  
  var hasInitialized = false;
  var toast_queue = [];
  
  var container = document.createElement("div");
  container.classList.add("animated", "fadeInOut");
  
  applyStyle(container, CardStyle);
  applyStyle(container, TextStyle);
  applyStyle(container, {
    position: "absolute",
    margin: "10px",
    padding: "10px",
    top: 0,
    right: 0, 
    backgroundColor: "#55a147",
    color: "white"
  });
  
  function addToast(msg, options) {
    var thisToast = {
      msg: msg,
      options: options
    };
    toast_queue.push(thisToast);
    
    if (toast_queue.length > 1) return;
    
    showToast(msg, options);
  }
  
  function showToast(msg, options) {
    
    if (!hasInitialized) document.body.appendChild(container);
    
    var options = options || {};
    container.innerText = msg;
    container.classList.remove("fadeOutUp");
    container.classList.add("fadeInDown");
    
    setTimeout(hideToast, options.delay || 2000);
  }
  
  function hideToast() {
    container.classList.remove("fadeInDown");
    container.classList.add("fadeOutUp");
    toast_queue.shift();
    setTimeout(nextToast, 500);
  }
  
  function nextToast() {
    if (toast_queue.length > 0) {
      var thisToast = toast_queue[0];
      showToast(thisToast.msg, thisToast.options, true);
    }
  }
  
  return {
    show: addToast,
    getQueue: function() {return toast_queue;}
  };
}();