

function Field(){
    this.rows = 1;
    this.cols = 1;
    this.size = 70;
    this.padding = 5;
    this.customColor1 = '#efefef';
    this.customColor2 = 'blue';
    this.textcolor = 'white';
}

function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

Field.prototype.init = function() {
    this.el = document.createElement('div');
    this.el.className = 'field';

    document.body.appendChild(this.el);
    this.fWidth = document.body.clientWidth * this.size / 100 | 0;
    
    var self = this;

    this.decColsBtn = document.createElement('div');
    this.decColsBtn.className = 'arrow-left';
    this.el.appendChild(this.decColsBtn);

    this.decColsBtn.onclick = function(e) {
        self.cellCount(0, -1);
    }

    this.incColsBtn = document.createElement('div');
    this.incColsBtn.className = 'arrow-right';
    this.el.appendChild(this.incColsBtn);

    this.incColsBtn.onclick = function(e) {
        self.cellCount(0, 1);
    }

    this.decRowsBtn = document.createElement('div');
    this.decRowsBtn.className = 'arrow-down';
    this.el.appendChild(this.decRowsBtn);

    this.decRowsBtn.onclick = function(e) {
        self.cellCount(-1, 0);
    }

    this.incRowsBtn = document.createElement('div');
    this.incRowsBtn.className = 'arrow-up';
    this.el.appendChild(this.incRowsBtn);

    this.incRowsBtn.onclick = function(e) {
        self.cellCount(1, 0);
    } 

}

Field.prototype.cellCount = function (r, c) {
    var redraw = false;

    if (r == 1 && this.rows < 10) {
        this.rows++
        redraw = true;
    }

    if (c == 1 && this.cols < 10) {
        this.cols++;
        redraw = true;
    }

    if (-1 == r && this.rows > 1) {
        this.rows--;
        redraw = true;
    }

    if (-1 == c && this.cols > 1) {
        this.cols--;
        redraw = true;
    }

    if (redraw) {
        this.drawCells();
    }
}

function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function gcf(a, b) {
    if ( ! b) {
        return a;
    }

    return gcf(b, a % b);
}

Field.prototype.drawCells = function () {
    var self = this;
    
    removeElementsByClass('cell');
    removeElementsByClass('label');
    this.cells = [];


    var cellSize = (this.fWidth / this.cols) - this.padding*(this.cols + 1);
    cellSize = cellSize | 0;
    this.el.style.width = (cellSize*this.cols + this.padding + this.padding*this.cols) + 'px';
    this.el.style.height = (cellSize*this.rows + this.padding + this.padding*this.rows) + 'px';
    


    for (i=1; i<= this.rows; i++) {
        for (j=1; j<= this.cols; j++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.width = cell.style.height = cellSize + 'px';
            cell.style.marginLeft = cell.style.marginTop = this.padding + 'px';
            cell.style.backgroundColor = this.customColor1;
            this.el.appendChild(cell);
            this.cells.push(cell);

            

            cell.onclick = function(i, j, cell) {
                return function(e){

                    var cells = document.getElementsByClassName('cell');
                    for (k=0;k<cells.length; k++) {

                        if (cell == cells[k]) continue;
                        cells[k].style.backgroundColor = self.customColor1;

                        var row = (k / self.cols | 0) + 1;
                        var col = k % self.cols +1;
                        if (row <= i && col <= j) {
                            cells[k].style.backgroundColor = 'green';
                        }
                    }
                    removeElementsByClass('inner-label');

                    cell.style.backgroundColor = self.customColor2;

                    var label = document.createElement('div');
                    label.className = 'inner-label';

                    if (self.rows == 1 && self.cols ==1) {
                        label.innerHTML = '1';
                    } else {
                        label.innerHTML = '<sup>1</sup>&frasl;<sub>'+ (self.rows*self.cols) +'</sub>';
                    }
                    label.style.color = self.textcolor;
                    removeElementsByClass('inner-label');
                    cell.appendChild(label);

                    var font = 20;
                    label.style.fontSize = font + 'px';
                    while (label.clientWidth/cell.clientWidth < 0.5 || label.clientHeight/cell.clientHeight < 0.5) {
                        font++;
                        label.style.fontSize = font + 'px';
                    }

                    label.style.fontSize = (font-1) + 'px';

                    label.style.marginLeft = '-' + (label.clientWidth/2) + 'px';
                    label.style.marginTop = '-' + (label.clientHeight/2) + 'px';

                    var mainLabel = document.getElementById('main-label');

                    var numerator = i*j;
                    var denominator = self.rows*self.cols;

                    var capt;
                    if (1 == numerator && 1 == denominator) {
                        capt = '1';
                    } else {
                        capt = '<sup>'+ numerator +'</sup>&frasl;<sub>'+ denominator +'</sub>';
                    } 
                    var gcfNumb = gcf(numerator, denominator);
                    var numerator1 = numerator / gcfNumb;
                    var denominator1 = denominator / gcfNumb;

                    if (1 == numerator1 && 1 == denominator1) {
                        capt += ' or 1';
                    } else {    
                        capt += ' or <sup>'+ numerator1 +'</sup>&frasl;<sub>'+ denominator1 +'</sub>';
                    }



                    mainLabel.innerHTML = capt;

                };
            }(i, j, cell);
        }
    }

    // display top fractions
    for (i=1; i <= this.cols; i++) {
        var label = document.createElement('div');

        if (1 == this.cols) {
            label.innerHTML = '1';
        } else {
            label.innerHTML = '<sup>1</sup>&frasl;<sub>'+ this.cols +'</sub>';
        }

        label.style.position = 'absolute';
        label.className = 'label';
        label.style.top = '-25px';
        this.el.appendChild(label);
        label.style.left = (i*this.padding + (i-1)*cellSize + cellSize/2 - label.clientWidth/2) + 'px';
    }

    // display left fractions
    for (i=1; i <= this.rows; i++) {
        var label = document.createElement('div');

        if (1 == this.rows) {
            label.innerHTML = '1';
        } else {
            label.innerHTML = '<sup>1</sup>&frasl;<sub>'+ this.rows +'</sub>';
        }

        label.style.position = 'absolute';
        label.className = 'label';
        label.style.left = '-25px';
        this.el.appendChild(label);
        label.style.top = (i*this.padding + (i-1)*cellSize + cellSize/2 - label.clientHeight/2) + 'px';
    }


}
