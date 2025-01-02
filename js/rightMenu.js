let rm = {};
rm.showRightMenu = function (isTrue, x = 0, y = 0) {
    let $rightMenu = $('#rightMenu');
    $rightMenu.css('top', x + 'px').css('left', y + 'px');

    if (isTrue) {
        stopMaskScroll();
        $rightMenu.show();
    } else {
        $rightMenu.hide();
    }
};

let rmWidth = $('#rightMenu').width();
let rmHeight = $('#rightMenu').height();

rm.reloadrmSize = function () {
    rmWidth = $("#rightMenu").width();
    rmHeight = $("#rightMenu").height();
};

window.oncontextmenu = function (event) {
    if (document.body.clientWidth > 768) {
        let pageX = event.clientX + 10;    
        let pageY = event.clientY;
        let $rightMenuNormal = $(".rightMenuNormal");
        let $rightMenuOther = $(".rightMenuOther");
        
        $rightMenuNormal.show();
        $rightMenuOther.show();
        
        rm.reloadrmSize();
        
        if (pageX + rmWidth > window.innerWidth) {
            pageX -= rmWidth;
        }
        if (pageY + rmHeight > window.innerHeight) {
            pageY -= rmHeight;
        }
        
        rm.showRightMenu(true, pageY, pageX);
        $('#rightmenu-mask').attr('style', 'display: flex');
        return false;
    }
};

function removeRightMenu() {
    rm.showRightMenu(false);
    $('#rightmenu-mask').attr('style', 'display: none');
}

function stopMaskScroll() {
    if (document.getElementById("rightmenu-mask")) {
        let xscroll = document.getElementById("rightmenu-mask");
        xscroll.addEventListener("mousewheel", function (e) {
            removeRightMenu();
        }, false);
    }
    if (document.getElementById("rightMenu")) {
        let xscroll = document.getElementById("rightMenu");
        xscroll.addEventListener("mousewheel", function (e) {
            removeRightMenu();
        }, false);
    }
}

// 基础导航功能
$('#menu-backward').on('click', function () { 
    window.history.back(); 
    removeRightMenu();
});

$('#menu-forward').on('click', function () { 
    window.history.forward(); 
    removeRightMenu();
});

$('#menu-refresh').on('click', function () { 
    window.location.reload(); 
    removeRightMenu();
});

$('#menu-home').on('click', function () { 
    window.location.href = window.location.origin; 
    removeRightMenu();
});

// 随机页面跳转
$('#menu-radompage').on('click', function (e) {
    e.preventDefault();
    $.ajax({
        url: '/api/posts',
        method: 'GET',
        success: function(posts) {
            if (posts && posts.length > 0) {
                const randomPost = posts[Math.floor(Math.random() * posts.length)];
                window.location.href = randomPost.url;
            } else {
                window.location.href = '/';
            }
        },
        error: function() {
            window.location.href = '/';
        }
    });
    removeRightMenu();
});

// 繁简转换相关函数
function JTPYStr() {
    return 'JTPYStr';
}

function FTPYStr() {
    return 'FTPYStr';
}

function Traditionalized(cc) {
    let str = '';
    const ss = JTPYStr();
    const tt = FTPYStr();
    for (let i = 0; i < cc.length; i++) {
        if (cc.charCodeAt(i) > 10000 && ss.indexOf(cc.charAt(i)) !== -1) {
            str += tt.charAt(ss.indexOf(cc.charAt(i)));
        } else {
            str += cc.charAt(i);
        }
    }
    return str;
}

function Simplized(cc) {
    let str = '';
    const ss = JTPYStr();
    const tt = FTPYStr();
    for (let i = 0; i < cc.length; i++) {
        if (cc.charCodeAt(i) > 10000 && tt.indexOf(cc.charAt(i)) !== -1) {
            str += ss.charAt(tt.indexOf(cc.charAt(i)));
        } else {
            str += cc.charAt(i);
        }
    }
    return str;
}

function translateInitialization() {
    translateButtonObject = document.getElementById('menu-translate');
    if (translateButtonObject) {
        if (currentEncoding !== targetEncoding) {
            setTimeout(translateBody, translateDelay);
        }
        translateButtonObject.addEventListener('click', translatePage, false);
    }
}

function translateBody(fobj) {
    let objs;
    if (typeof fobj === 'object') objs = fobj.childNodes;
    else objs = document.body.childNodes;
    
    for (let i = 0; i < objs.length; i++) {
        const obj = objs.item(i);
        if ('||BR|HR|'.indexOf('|' + obj.tagName + '|') > 0 || obj === translateButtonObject) {
            continue;
        }
        if (obj.title !== '' && obj.title != null) obj.title = translateText(obj.title);
        if (obj.alt !== '' && obj.alt != null) obj.alt = translateText(obj.alt);
        if (obj.placeholder !== '' && obj.placeholder != null) obj.placeholder = translateText(obj.placeholder);
        if (obj.tagName === 'INPUT' && obj.value !== '' && obj.type !== 'text' && obj.type !== 'hidden') {
            obj.value = translateText(obj.value);
        }
        if (obj.nodeType === 3) obj.data = translateText(obj.data);
        else translateBody(obj);
    }
}

function translatePage() {
    if (targetEncoding === 1) {
        currentEncoding = 1;
        targetEncoding = 2;
        saveToLocal.set(targetEncodingCookie, targetEncoding, 2);
        translateBody();
        if (snackbarData) btf.snackbarShow(snackbarData.cht_to_chs);
    } else if (targetEncoding === 2) {
        currentEncoding = 2;
        targetEncoding = 1;
        saveToLocal.set(targetEncodingCookie, targetEncoding, 2);
        translateBody();
        if (snackbarData) btf.snackbarShow(snackbarData.chs_to_cht);
    }
}

// 暗黑模式切换
function switchDarkMode() {
    removeRightMenu();
    const nowMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    if (nowMode === 'light') {
        activateDarkMode();
        saveToLocal.set('theme', 'dark', 2);
        GLOBAL_CONFIG.Snackbar !== undefined && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
    } else {
        activateLightMode();
        saveToLocal.set('theme', 'light', 2);
        GLOBAL_CONFIG.Snackbar !== undefined && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.night_to_day);
    }
    typeof utterancesTheme === 'function' && utterancesTheme();
    typeof FB === 'object' && window.loadFBComment();
    window.DISQUS && document.getElementById('disqus_thread').children.length && setTimeout(() => window.disqusReset(), 200);
}

// 事件绑定
$('#menu-darkmode').on('click', function () { switchDarkMode(); });
$('#menu-translate').on('click', function () { translatePage(); });
$(".menu-link").on("click", function () { removeRightMenu(); });
$("#rightmenu-mask").on("click", function () { removeRightMenu(); });
$("#rightmenu-mask").contextmenu(function () {
    removeRightMenu();
    return false;
});

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    translateInitialization();
    document.addEventListener('pjax:complete', translateInitialization);
});