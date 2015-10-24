var dragSrcEl = null;

function handleDragStart(e) {
  // Target (this) element is the source node.
  this.classList.add('moving');

  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  e.dataTransfer.setData('original_file_name', this.getAttribute('data-original_file_name'));
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
    // Insert the column before the selected one
    dragSrcEl.remove();
    var div = document.createElement('div');
    div.className = "portfolio-item column";
    div.draggable = true;
    div.setAttribute('data-original_file_name', e.dataTransfer.getData('original_file_name'));
    div.innerHTML = e.dataTransfer.getData('text/html');
    this.parentNode.insertBefore(div, this);
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
        col.style.setProperty('width', size_split[1]);
    });

    // Set tiles height to fit in the column box
    [].forEach.call(tiles, function(tile) {
        tile.style.setProperty('height', Math.min(size_split[0] - 36, tile.clientHeight));
    });
}

function pictureClick(link) {
    var pictureSrc = 'media/' + link.parentNode.getAttribute('data-original_file_name');
    var pictureTitle = unescape(link.firstChild.title);
    var headerNumber = link.previousSibling.innerHTML;

    document.getElementsByClassName('modal-title')[0].innerHTML =
        headerNumber + ' - <a href="#" id="file_name" class="edit_file_name">' + pictureTitle + '</a>';
    document.getElementsByClassName('modal-body')[0].innerHTML = [
        '<div class="row"><div class="col-lg-12">',
            '<img class="img-responsive img-center" src="', pictureSrc, '" title="', headerNumber, '"/>',
        '</div></div>'
    ].join('');

    $.fn.editable.defaults.mode = 'inline';
    $('.edit_file_name').editable({
        success: function(response, newValue) {
            $.ajax({
                "url": "/change_file_name?from_name=" + escape(this.text) + "&to_name=" + escape(newValue)
            }).done(function(data) {
                link.parentNode.setAttribute('data-original_file_name', newValue);
            })
        }
    });

    return false;
}

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


function handleInputFolder(evt) {
    var input_folder = document.getElementById('input_folder');
    $('#input_folder_btn').toggleClass('active');
    $.ajax({
        "url": "/get_files?input_folder=" + encodeURIComponent(input_folder.value)
    }).done(function (data) {
        data = data['data'];
        var media_folder = '{{MEDIA_URL}}';
        for (var i = 0; i < data.length; i++) {
            // Render thumbnail.
            var div = document.createElement('div');
            div.className = "portfolio-item column";
            div.draggable = true;
            div.setAttribute('data-original_file_name', data[i]['original_file_name']);
            div.innerHTML = ['<header>', i+1, '</header>',
                '<a href="#" data-toggle="modal" data-target="#pictureModal" onclick="return pictureClick(this);">',
                    '<img class="img-responsive tile" src="media/', data[i]['thumbnail_file_name'], '" title="',
                    escape(data[i]['original_file_name']), '"/>',
                '</a>'].join('');
            document.getElementById('columns').insertBefore(div, null);
        }

        setTimeout(function() {
            resizeTiles();

            $('#input_folder_btn').toggleClass('active');

            $.fn.editable.defaults.mode = 'inline';
            $('.edit_tile_number').editable({
                success: function(response, newValue) {
                    // TODO
                }
            });
        }, 1000);
    });
}
$('#input_folder_btn').click(handleInputFolder);


function handleOutputFolder(evt) {
    var output_folder = document.getElementById('output_folder');
    var columns = document.getElementById('columns');
    var files_ordered = [];

    for (var i = 0; i < columns.children.length; i++) {
        var file_name = columns.children[i].getAttribute('data-original_file_name');
        files_ordered.push(file_name);
    }

    $.ajax({
        "url": "/save_files?output_folder=" + encodeURIComponent(output_folder.value) +
                           "&files_ordered=" + encodeURIComponent(files_ordered)
    }).done(function (data) {
        console.dir(data);
    });
}
$('#output_folder_btn').click(handleOutputFolder);
