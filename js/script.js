var framesContainer = document.getElementById('framesContainer');
var previews = document.getElementById('previewsContainer').childNodes;

var gifLink = document.getElementById('gifLink');

document.getElementById('createBtn').addEventListener('click', generateGif);
document.getElementById('newFrameBtn').addEventListener('click', addFrame);
document.getElementById('delFrameBtn').addEventListener('click', deleteFrame);
document.getElementById('imageLoader').addEventListener('change', handleImage, false);

document.getElementById('scale').addEventListener('mousemove', scale);
document.getElementById('rot-r').addEventListener('click', rotateClockwise);
document.getElementById('rot-l').addEventListener('click', rotateCounterClockwise);

var activeFrame;
var frames = [];

var bg = new Image();
bg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
var overlay = new Image();
overlay.onload = init;
overlay.src = 'img/overlay.png';    

function init() {
    addFrame();
    if (localStorage['gifUrl']) {
        updateGifLink(localStorage['gifUrl']);
    }
}

function generateGif() {
    var gif = new GIF({
        workerScript: 'js/gif.worker.js'
    });
    for (var i=0; i<frames.length; i++) {
        gif.addFrame(frames[i].node, {delay: 850});
    }
    gif.on('finished', function(blob) {
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
            uploadGif(reader.result);
        });
        reader.readAsDataURL(blob);
    });
    gif.render();
}

function updateGifLink(url) {
    gifLink.href = url;
    gifLink.innerHTML = url;
}

function uploadGif(data) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        url = this.response;
        localStorage['gifUrl'] = url;
        updateGifLink(url);
    }
    xhr.open('POST', 'http://hhsfbla.com/upload-gif.php');
    xhr.send(data);
}

function newCanvas() {
    var newCanvasNode = document.createElement('canvas');
    newCanvasNode.width = 600;
    newCanvasNode.height = 600;
    newCanvasNode.id = 'frame-' + frames.length;
    newCanvasNode.addEventListener('mousedown', startDrag);
    newCanvasNode.addEventListener('mousemove', dragImage);
    newCanvasNode.addEventListener('mouseup', endDrag);
    return newCanvasNode;
}

function newPreview() {
    var newPreviewNode = document.createElement('a');
    newPreviewNode.href = '#frame-' + frames.length;
    newPreviewNode.appendChild(document.createElement('img'));
    newPreviewNode.addEventListener('click', changeFrame);
    return newPreviewNode;
}

function addFrame() {
    var newCanvasNode = newCanvas();
    var newPreviewNode = newPreview();
    var newFrame = {
        node: newCanvasNode,
        context: newCanvasNode.getContext('2d'),
        previewNode: newPreviewNode,
        img: bg,
        imgX: 0,
        imgY: 0,
        imgScl: 1.0,
        width: function() {
            return 700*this.imgScl;
        },
        height: function() {
            return (this.img.height/this.img.width)*700*this.imgScl;
        },
        imgRot: 0,
        draw: function() {
            this.context.clearRect(0, 0, 600, 600);
            this.context.save();
            this.context.translate(300, 300);
            this.context.rotate(this.imgRot*Math.PI/180);
            this.context.fillStyle = '#fff';
            this.context.fillRect(0, 0, 600, 600);
            this.context.drawImage(this.img, -300+this.imgX, -300+this.imgY, this.width(), this.height());
            this.context.restore();
            this.context.drawImage(overlay, 0, 0, 600, 600);
            this.updatePreview();
        },
        updatePreview: function() {
            this.previewNode.childNodes[0].src = this.node.toDataURL('image/png');
        },
        move: function(deltaX, deltaY) {
            if (this.imgRot==0) {
                this.imgX += deltaX;
                this.imgY += deltaY;
            }
            if (this.imgRot==90 || this.imgRot==-270) {
                this.imgX += deltaY;
                this.imgY -= deltaX;
            }
            if (this.imgRot==180 || this.imgRot==-180) {
                this.imgX -= deltaX;
                this.imgY -= deltaY;
            }
            if (this.imgRot==270 || this.imgRot==-90) {
                this.imgX -= deltaY;
                this.imgY += deltaX;
            }
        }
    };
    frames.push(newFrame);
    framesContainer.appendChild(newFrame.node);
    previewsContainer.appendChild(newFrame.previewNode);
    setActiveFrame(frames.length-1);
}

function deleteFrame() {
    var i = activeFrame.node.id.split('-')[1];
    framesContainer.removeChild(activeFrame.node);
    previewsContainer.removeChild(activeFrame.previewNode);
    frames.splice(i, 1);
    setActiveFrame(frames.length-1);
}

function changeFrame(e) {
    var id = e.target.parentNode.hash.split('-')[1];
    setActiveFrame(id);
}

function setActiveFrame(i) {
    if (activeFrame) activeFrame.previewNode.classList.remove('current');
    window.location.hash = 'frame-' + i;
    activeFrame = frames[i];
    activeFrame.draw();
    activeFrame.previewNode.classList.add('current');
}

function handleImage(e) {
    var reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.onload = function() {
            activeFrame.img = this;
            activeFrame.draw();
            activeFrame.updatePreview();
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(e.target.files[0]); 
}

var mouse = {
    dragStarted: false,
    x: null,
    y: null,
    getNewCoords: function(e) {
        return {
            x: e.clientX,
            y: e.clientY
        };
    },
    updateCoords: function(x, y) {
        this.x = x;
        this.y = y;
    }
};

function startDrag(e) {
    mouse.dragStarted = true;
    coords = mouse.getNewCoords(e);
    mouse.updateCoords(coords.x, coords.y);
}

function endDrag(e) {
    mouse.dragStarted = false;
}

function dragImage(e) {
    if (mouse.dragStarted) {     
        newCoords = mouse.getNewCoords(e);
        activeFrame.move(newCoords.x-mouse.x, newCoords.y-mouse.y);
        mouse.updateCoords(newCoords.x, newCoords.y);
    }
    activeFrame.draw();
}

function scale(e) {
    activeFrame.imgScl = e.target.value;
    activeFrame.draw();
}

function rotate(direction) {
    activeFrame.imgRot += 90*direction;
    activeFrame.imgRot %= 360;
    activeFrame.draw();
}

function rotateClockwise() {
    rotate(1);
}

function rotateCounterClockwise() {
    rotate(-1);
}
