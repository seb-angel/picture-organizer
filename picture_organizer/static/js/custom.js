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
    var size_dd = document.getElementById("tile_size");
    var size_split = size_dd.options[size_dd.selectedIndex].value.split('x');
    var div = document.createElement('div');
    div.className = "portfolio-item column";
    div.draggable = true;
    div.style.setProperty('height', size_split[0]);
    div.style.setProperty('width', size_split[1]);
    div.setAttribute('data-original_file_name', e.dataTransfer.getData('original_file_name'));
    div.innerHTML = e.dataTransfer.getData('text/html');
    this.parentNode.insertBefore(div, this);
  }

  var cols = document.querySelectorAll('#columns .column');
  for (var i = 0; cols[i]; i++) {
    cols[i].classList.remove('moving');
    cols[i].classList.remove('over');
    $(cols[i]).find('.edit_tile_number').editable('setValue', i+1);
    $(cols[i]).find('.edit_tile_number').editable({
        success: function(response, newValue) {
            console.log(isNaN(newValue));
            if (!isNaN(newValue)) {
                var tile_found = false;
                var tile_from = null;
                var tile_to_next_sibling = null;
                var this_tile_number = this.text;

                if (typeof tile_from !== 'undefined' && typeof tile_to_next_sibling !== 'undefined') {
                    var cols = document.getElementById('columns');
                    cols.insertBefore(cols.childNodes[this_tile_number - 1], cols.childNodes[newValue - 1]);
                    for (var i = 0; i < cols.childNodes.length; i++) {
                        $(cols.childNodes[i]).find('.edit_tile_number').editable('setValue', i+1);
                    }
                }
            }
            else {
                $(this).editable('setValue', this.text); // Revert the change
            }
        }
    });
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

function removeFileExtension(file_name) {
    return file_name.split('.')[0];
}

function pictureClick(link) {
    var pictureSrc = 'media/' + link.parentNode.getAttribute('data-original_file_name');
    var pictureTitle = unescape(link.firstChild.title);
    var headerNumber = $(link.previousSibling.firstChild).editable('getValue', true);

    document.getElementsByClassName('modal-title')[0].innerHTML =
        '<span id="tile_number">' + headerNumber + '</span> - <a href="#" class="edit_file_name">' + removeFileExtension(pictureTitle) + '</a>';
    document.getElementsByClassName('modal-body')[0].innerHTML = [
        '<div class="row"><div class="col-lg-12">',
            '<img class="img-responsive img-center" src="', pictureSrc, '" title="', pictureTitle, '"/>',
        '</div></div>'
    ].join('');

    $.fn.editable.defaults.mode = 'inline';
    $('.edit_file_name').editable({
        inputclass: 'edit_file_name_input',
        success: function(response, newValue) {
            $.ajax({
                "url": "/change_file_name?from_name=" + escape(this.text) + "&to_name=" + escape(newValue)
            }).done(function(data) {
                link.parentNode.setAttribute('data-original_file_name', newValue);
                link.firstChild.title = removeFileExtension(newValue);
                link.firstChild.src = 'media/' + data['data']['thumbnail'];
            })
        }
    });
    $.fn.editable.defaults.mode = 'popup';

    $('#btn_previous').prop("disabled", false);
    $('#btn_next').prop("disabled", false);
    if (headerNumber == 1) {
        $('#btn_previous').prop("disabled", true);
    }
    else if (headerNumber == document.querySelectorAll('#columns .column').length) {
        $('#btn_next').prop("disabled", true);
    }

    return false;
}
function btnPreviousClick(btn) {
    var tile_number = parseInt($('#tile_number').html());
    var cols = document.getElementById('columns');
    pictureClick($(cols.childNodes[tile_number - 2]).find('a')[1]);
    return false;
}
function btnNextClick(btn) {
    var tile_number = parseInt($('#tile_number').html());
    var cols = document.getElementById('columns');
    pictureClick($(cols.childNodes[tile_number]).find('a')[1]);
    return false;
}

function resizeTiles() {
    var size_dd = document.getElementById("tile_size");
    var size_split = size_dd.options[size_dd.selectedIndex].value.split('x');

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

    // Set editable tile number
    $('.edit_tile_number').editable({
        success: function(response, newValue) {
            if (!isNaN(newValue)) {
                var tile_found = false;
                var tile_from = null;
                var tile_to_next_sibling = null;
                var this_tile_number = this.text;

                if (typeof tile_from !== 'undefined' && typeof tile_to_next_sibling !== 'undefined') {
                    var cols = document.getElementById('columns');
                    cols.insertBefore(cols.childNodes[this_tile_number - 1], cols.childNodes[newValue - 1]);
                    for (var i = 0; i < cols.childNodes.length; i++) {
                        $(cols.childNodes[i]).find('.edit_tile_number').editable('setValue', i+1);
                    }
                }
            }
            else {
                $(this).editable('setValue', this.text); // Revert the change
            }
        }
    });
}, 1000);


var progress_bar_interval = null;
function show_progress_bar() {
    $('.progress').fadeIn('slow');

    progress_bar_interval = setInterval(function() {
        // Update progress bar
        $.ajax({
            "url": "/get_progress"
        }).done(function (data) {
            var progress = data['data']['progress'];

            $('.progress-bar').css('width', progress + '%').attr('aria-valuenow', progress).html(progress + '%')

            if (progress == 100) {
                resizeTiles();
                clearInterval(progress_bar_interval);
                setTimeout(function() {
                    $('.progress').fadeOut('slow');
                }, 1000);
            }
        });
    }, 100);
}


function loadFiles(data) {
    var media_folder = '{{MEDIA_URL}}';
    for (var i = 0; i < data.length; i++) {
        // Render thumbnail.
        var size_dd = document.getElementById("tile_size");
        var size_split = size_dd.options[size_dd.selectedIndex].value.split('x');
        var div = document.createElement('div');
        div.className = "portfolio-item column";
        div.draggable = true;
        div.style.setProperty('height', size_split[0]);
        div.style.setProperty('width', size_split[1]);
        div.setAttribute('data-original_file_name', data[i]['original_file_name']);
        div.innerHTML = ['<header><a href="#" class="edit_tile_number"></a></header>',
            '<a href="#" data-toggle="modal" data-target="#pictureModal" onclick="return pictureClick(this);">',
                '<img class="img-responsive tile" src="media/', data[i]['thumbnail_file_name'], '" title="',
                escape(data[i]['original_file_name']), '"/>',
            '</a>'].join('');

        document.getElementById('columns').insertBefore(div, null);

        $(div).find('.edit_tile_number').editable({
            value: $('#columns .column').length,
            success: function(response, newValue) {
                if (!isNaN(newValue)) {
                    var tile_found = false;
                    var tile_from = null;
                    var tile_to_next_sibling = null;
                    var this_tile_number = this.text;

                    if (typeof tile_from !== 'undefined' && typeof tile_to_next_sibling !== 'undefined') {
                        var cols = document.getElementById('columns');
                        cols.insertBefore(cols.childNodes[this_tile_number - 1], cols.childNodes[newValue - 1]);
                        for (var i = 0; i < cols.childNodes.length; i++) {
                            $(cols.childNodes[i]).find('.edit_tile_number').editable('setValue', i+1);
                        }
                    }
                }
                else {
                    $(this).editable('setValue', this.text); // Revert the change
                }
            }
        });
    }
}

function handleInputFolder(evt) {
    show_progress_bar();
    var input_folder = document.getElementById('input_folder');
    var is_new_batch = $('#columns .column').length === 0;
    $.ajax({
        "url": "/get_files?input_folder=" + encodeURIComponent(input_folder.value) + '&is_new_batch=' + is_new_batch
    }).done(function (data) {
        data = data['data'];
        loadFiles(data);
    });
}
$('#input_folder_btn').click(handleInputFolder);
$('#input_folder').keypress(handleInputFolder);


function handleOutputFolder(evt) {
    show_progress_bar();
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
        console.log('Save Files Done');
    });
}
$('#output_folder_btn').click(handleOutputFolder);
$('#output_folder').keypress(handleOutputFolder);

function handleDeleteTile(evt) {
    var file_name = $('.edit_file_name').editable('getValue', true);
    $.ajax({
        "url": "/delete_file?file_name=" + encodeURIComponent(file_name)
    }).done(function (data) {
        var tile_number_to_remove = $('#tile_number').html();
        var columns = document.querySelectorAll('#columns .column');
        var tile_found = false;
        [].forEach.call(columns, function(column) {
            var tile_number = $(column).find('.edit_tile_number').editable('getValue', true);
            if (tile_found) {
                $(column).find('.edit_tile_number').editable('setValue', tile_number - 1);
            }
            else if (tile_number == tile_number_to_remove) {
                column.remove();
                tile_found = true
            }
        });
    });
}
$('#delete_tile_btn').click(handleDeleteTile);
