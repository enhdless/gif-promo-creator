var gif = new GIF({
    workerScript: 'js/gif.worker.js'
});

var framesContainer = document.getElementById('framesContainer');
var previews = document.getElementById('previewsContainer').childNodes;

document.getElementById('createBtn').addEventListener('click', generateGif);
document.getElementById('newFrameBtn').addEventListener('click', addFrame);
document.getElementById('imageLoader').addEventListener('change', handleImage, false);

var activeFrame;
var frames = [];

var bg = new Image();
bg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
var overlay = new Image();
overlay.onload = function() {
    init();
}
overlay.src = 'img/logo.png';    

function init() {
    addFrame();
}

function generateGif() {
    for (var i=0; i<frames.length; i++) {
        gif.addFrame(frames[i].node, {delay: 850});
    }
    gif.on('finished', function(blob) {
        window.open(URL.createObjectURL(blob));
    });
    gif.render();
}

function newCanvas() {
    var newCanvasNode = document.createElement('canvas');
    newCanvasNode.width = 600;
    newCanvasNode.height = 600;
    newCanvasNode.id = 'frame-' + frames.length;
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
            return 600*this.imgScl;
        },
        height: function() {
            return (this.img.height/this.img.width)*600*this.imgScl;
        },
        imgRot: 0,
        draw: function() {
            this.context.drawImage(this.img, this.imgX, this.imgY, this.width(), this.height());
            this.context.drawImage(overlay, 300-overlay.width/2, 300-overlay.height/2);
            this.updatePreview();
        },
        updatePreview: function() {
            this.previewNode.childNodes[0].src = this.node.toDataURL('image/png');
        }
    };
    frames.push(newFrame);
    framesContainer.appendChild(newFrame.node);
    previewsContainer.appendChild(newFrame.previewNode);
    setActiveFrame(frames.length-1);
}

function changeFrame(e) {
    var id = e.target.parentNode.hash.split('-')[1];
    setActiveFrame(id);
}

function setActiveFrame(i) {
    window.location.hash = 'frame-' + i;
    activeFrame = frames[i];
    activeFrame.draw();
}

function handleImage(e) {
    var reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.onload = function(){
            activeFrame.img = this;
            activeFrame.draw();
            activeFrame.updatePreview();
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(e.target.files[0]); 
}
