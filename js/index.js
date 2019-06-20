const view = {
	x0: 0,
	y0: 0,
	rotateX: 345,
	rotateY: 345,
	speedX: 0,
	speedY: 0,
	go: true,
	cancelClick: false,
	zoom: 1,
};

const productInfo = {};

// 执行入口
window.onload = function() {
	funcInitProduct('product0');
};

// 初始化
function funcInitProduct(path) {
  if (!path) {
    console.log('请指定产品的6视图路径');
    return;
  }
  
  console.log('path', path);
  funcGetProductInfo(path, 0);
	
	const stage = document.getElementById('div_stage');
	if (funcIsPC()) {
		stage.onmousedown = funcMouseDown;
		stage.onmouseup = funcMouseUp;
		stage.onmousemove = funcMouseMove;
	} else {
		stage.ontouchstart = funcMouseDown;
		stage.ontouchend = funcMouseUp;
		stage.ontouchmove = funcMouseMove;
		stage.ontouchcancel = funcMouseUp;
	}
	stage.onmousewheel = funcMouseZoom;
}

// 判断是电脑还是手机
// true为PC端, false为手机端
function funcIsPC() {
		var userAgentInfo = navigator.userAgent;
		var Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
		var flag = true;
		for (var v = 0; v < Agents.length; v++) {
				if (userAgentInfo.indexOf(Agents[v]) > 0) {
						flag = false;
						break;
				}
		}
		return flag;
}

// 获取产品6视图的详细信息
function funcGetProductInfo(path, pointer) {
  const imgType = ['face', 'back', 'left', 'right', 'top', 'bottom'];
  const fileName = imgType[pointer];
  const imgSrc = 'img/' + path + '/' + fileName + '.jpg';
  console.log('getImageSize', imgSrc);
  const imgDom = new Image();
  imgDom.src = imgSrc;
  imgDom.onload = function(e) {
    productInfo[fileName] = {
      width: imgDom.width,
      height: imgDom.height,
    };

    pointer += 1;
    if (pointer < imgType.length) funcGetProductInfo(path, pointer);
    else {
      productInfo.face.translateZ = productInfo.left.width / 2;
      productInfo.back.rotateY = 180;
      productInfo.back.translateZ = productInfo.left.width / 2;
      productInfo.left.rotateY = 270;
      productInfo.left.translateZ = productInfo.left.width / 2;
      productInfo.right.rotateY = 90;
      productInfo.right.translateZ = productInfo.face.width - productInfo.right.width / 2;
      productInfo.top.rotateX = 90;
      productInfo.top.translateZ = productInfo.top.height / 2;
      productInfo.bottom.rotateX = 270;
      productInfo.bottom.translateZ = productInfo.bottom.height / 2;
      productInfo.bottom.translateZ += productInfo.face.height - productInfo.bottom.height;

      // 根据产品的6视图生成立体图
      console.log(JSON.stringify(productInfo));
      var html='';
      for (var i = 0; i < imgType.length; i += 1) {
        var item = imgType[i];
        var img = productInfo[item];
        var imgUrl = 'img/' + path + '/' + item + '.jpg';
        html +=
        '<div class="div_block" onclick="funcMouseClick(event)"' +
        ' style="width:' + img.width + 'px; height:' + img.height + 'px;' +
        ' background-image:url(' + imgUrl + ');' +
        ' transform:rotateY(' + (img.rotateY || 0) + 'deg)' +
        ' rotateX(' + (img.rotateX || 0) + 'deg)' +
        ' translateZ(' + img.translateZ + 'px);">'+
        '</div>';
      }
      const container = document.getElementById('div_container');
      container.style.width = productInfo.face.width + 'px';
      container.style.height = productInfo.face.height + 'px';
      var tf = 'rotateX(' + view.rotateX + 'deg) rotateY(' + view.rotateY + 'deg)';
      container.style.transform = tf;
      container.innerHTML = html;
    }
  };
}

function funcMouseDown(evt) {
	if (funcIsPC()) {
		view.x0 = evt.clientX;
		view.y0 = evt.clientY;
	} else {
		view.x0 = parseInt(evt.touches[0].pageX, 10);
		view.y0 = parseInt(evt.touches[0].pageY, 10);
	}
	view.go = true;
	funcGo();
	view.cancelClick = false;
}
function funcMouseUp(evt) {
	view.x0 = 0;
	view.y0 = 0;
	view.speedX = 0;
	view.speedY = 0;
	view.go = false;
}
function funcMouseMove(evt) {
	if (view.x0 === 0 || view.y0 === 0) return;

	var x1 = 0;
	var y1 = 0;
	if (funcIsPC()) {
		x1 = evt.clientX - view.x0;
		y1 = evt.clientY - view.y0;
	} else {
		x1 = parseInt(evt.touches[0].pageX, 10) - view.x0;
		y1 = parseInt(evt.touches[0].pageY, 10) - view.y0;
	}
	if (x1 === 0 && y1 === 0) return;

	view.cancelClick = true;

	// 优化操作体验: 同一时刻只旋转幅度更大的轴, x轴或y轴
	if (Math.abs(x1) >= Math.abs(y1)) {
		x1 /= 5;
		x1 = Math.round(x1);
		x1 = (x1 >  50) ?  50 : x1;
		x1 = (x1 < -50) ? -50 : x1;
		x1 = (x1 >=  0) ?  51 - x1 : -51 - x1;
		view.speedX = x1;
		view.speedY = 0;
	} else {
		// 优化操作体验: 反转上下拖动, 产品随拖动方向旋转
		y1 = (y1 >= 0) ? -y1 : Math.abs(y1);
		y1 /= 5;
		y1 = Math.round(y1);
		y1 = (y1 >  50) ?  50 : y1;
		y1 = (y1 < -50) ? -50 : y1;
		y1 = (y1 >=  0) ?  51 - y1 : -51 - y1;
		view.speedY = y1;
		view.speedX = 0;
	}
}

// 某一面的点击事件(旋转并过渡到目标面上)
function funcMouseClick(evt) {
	if (view.cancelClick) return;
	var tf = evt.target.style.transform;
	view.rotateX = 360 - parseInt(tf.substr(tf.indexOf('rotateX') + 8, 4), 10);
	view.rotateY = 360 - parseInt(tf.substr(tf.indexOf('rotateY') + 8, 4), 10);
	tf = 'rotateX(' + view.rotateX + 'deg) rotateY(' + view.rotateY + 'deg)';
	const container = document.getElementById('div_container');
	container.style.transition = 'transform 0.4s';
	container.style.transform = tf;
	setTimeout(function() {
		container.style.transition = 'unset';
	}, 400);
}

// 鼠标滚轮可控制产品展示图的缩放
function funcMouseZoom(evt) {
	const dir = (evt.wheelDelta >= 0) ? 1 : -1;
	view.zoom += dir * 0.1;
	if (view.zoom > 2) view.zoom = 2;
	if (view.zoom < 0.5) view.zoom = 0.5;
	const zoomLayer = document.getElementById('div_zoomLayer');
	zoomLayer.style.transform = 'scale(' + view.zoom + ')';
}

function funcGo() {
	if (!view.go) return;

	var i = 0.2;

  if (view.speedY) {
    if (view.speedY < 0) i = -i;
    view.rotateX += i;
    view.rotateX = parseFloat(view.rotateX.toFixed(1));
    if (view.rotateX > 360) view.rotateX = 0;
    if (view.rotateX < 0)   view.rotateX = 360;
  }

  if (view.speedX) {
		if (view.speedX < 0) i = -i;
		view.rotateY += i;
		view.rotateY = parseFloat(view.rotateY.toFixed(1));
		if (view.rotateY > 360) view.rotateY = 0;
		if (view.rotateY < 0)   view.rotateY = 360;
	}

	if (view.speedX || view.speedY) {
		var tf = 'rotateX(' + view.rotateX + 'deg) rotateY(' + view.rotateY + 'deg)';
    const container = document.getElementById('div_container');
    container.style.transform = tf;
  }

	// 优化操作体验: 拖动实现缓动
	setTimeout(funcGo, Math.abs(view.speedX) || Math.abs(view.speedY));
}
