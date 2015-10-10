var dragSrcEl = null;

function handleDragStart(e) {
  // Target (this) element is the source node.
  this.classList.add('moving');

  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }

  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

  return false;
}

function handleDragEnter(e) {
  // this / e.target is the current hover target.
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');  // this / e.target is previous target element.
}

function handleDrop(e) {
  // this/e.target is current target element.

  if (e.stopPropagation) {
    e.stopPropagation(); // Stops some browsers from redirecting.
  }

  // Don't do anything if dropping the same column we're dragging.
  if (dragSrcEl != this) {
    // Set the source column's HTML to the HTML of the column we dropped on.
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/html');
  }

  var cols = document.querySelectorAll('#columns .column');
  for (var i = 0, f; f = cols[i]; i++) {
    cols[i].classList.remove('moving');
    cols[i].classList.remove('over');
    cols[i].children[0].innerHTML = i+1;
  };

  return false;
}


function handleDragEnd(e) {
  // this/e.target is the source node.
  var cols = document.querySelectorAll('#columns .column');
  [].forEach.call(cols, function (col) {
    col.classList.remove('moving');
    col.classList.remove('over');
  });
}


function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    var order = 1;

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (!f.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var div = document.createElement('div');
          div.className = "portfolio-item column";
          div.draggable = true;
          div.innerHTML = ['<header>', order++,'</header>',
            '<a href="#"><img class="img-responsive tile" src="', e.target.result,
              '" title="', escape(theFile.name), '" alt=""/></a>'].join('');
          document.getElementById('columns').insertBefore(div, null);

          resizeTiles();
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
}

function resizeTiles() {
    var e = document.getElementById("tile_size");
    var size_split = e.options[e.selectedIndex].value.split('x');

    var tiles = document.querySelectorAll('.tile');
    // Set tiles height to auto
    [].forEach.call(tiles, function(tile) {
        tile.style.setProperty('height', 'auto');
    });

    var cols = document.querySelectorAll('#columns .column');
    [].forEach.call(cols, function(col) {
        col.style.setProperty('height', size_split[0]);
        col.style.setProperty('width', size_split[0]);
    });

    // Set tiles height to fit in the column box
    [].forEach.call(tiles, function(tile) {
        tile.style.setProperty('height', Math.min(size_split[0] - 36, tile.clientHeight));
    });
}

document.getElementById('file_list').addEventListener('change', handleFileSelect, false);

document.getElementById('tile_size').addEventListener('change', resizeTiles, false);

setInterval(function() {
    // Initialize tiles
    var cols = document.querySelectorAll('#columns .column');
    [].forEach.call(cols, function(col) {
      col.addEventListener('dragstart', handleDragStart, false);
      col.addEventListener('dragenter', handleDragEnter, false)
      col.addEventListener('dragover', handleDragOver, false);
      col.addEventListener('dragleave', handleDragLeave, false);
      col.addEventListener('drop', handleDrop, false);
      col.addEventListener('dragend', handleDragEnd, false);
    });
}, 1000);
