

function Field(){
    this.rows = 1;
    this.cols = 3;
    this.size = 70;
    this.padding = 5;
    this.customColor1 = '#efefef';
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

Field.prototype.drawCells = function () {
    
    removeElementsByClass('cell');

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
        }
    }
}
