let currCoords,
    myMap,
    cluster,
    currClusterGObjs = [];
const infoPoint = document.querySelector('#infoPoint'),
    infoPointCloseBtn = document.querySelector("#closeInfoPoint"),
    ipAddr = document.querySelector('#ipAddr'),
    rvsList = document.querySelector('#rvsList'),
    rvUserName = document.querySelector('#rvUserName'),
    rvPlaceName = document.querySelector('#rvPlaceName'),
    rvText = document.querySelector('#rvText'),
    save = document.querySelector('#save'),
    map = document.querySelector('#map');
const emptyRvsListPlaceholder = 'Пока отзывов нет';

infoPoint.style.display ='none';

ymaps.ready(init);

function init(){ 

    myMap = new ymaps.Map("map", {
        center: [48.321317317352765,25.933917499999996],
        zoom: 16,
        controls: ['zoomControl']
    });

    // Создаем собственный макет с информацией о выбранном геообъекте.
    var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="baloon">' +
            '<p><b>{{ properties.review.rvPlaceName|raw }}</b></p>' +
            '<p><a id="baloonHref" href=# onclick="baloonHrefClick()">{{ properties.review.ipAddr|raw }}</a></p>' +
            '<p>{{ properties.review.rvText|raw }}</p>' +
            '<p>{{ properties.review.dateTime|raw }}</p>' +
        '</div>'
    );

    clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5
    });
    myMap.geoObjects.add(clusterer);

    clusterer.balloon.events.add('open', function (e) {
        infoPoint.style.display = 'none';
    });

    clusterer.events.add('click', function (e) {
        currClusterGObjs = e.get('target').properties._data.geoObjects;
    });

    myMap.events.add('click', function (e) {
        clusterer.balloon.close();
        resetInfoPoint();
        ipAddr.innerText = 'загрузка...';
        // Получение координат щелчка
        currCoords = e.get('coords');

        ymaps.geocode(currCoords).then(function (res) {
            var firstGeoObject = res.geoObjects.get(0);

            ipAddr.innerText = firstGeoObject.getAddressLine();
        });

        let evtDOM = e.get('domEvent').originalEvent;

        infoPoint.style.left = `${evtDOM.clientX}px`;
        infoPoint.style.top = `${evtDOM.clientY}px`;
        putInOrderCords();
        rvsList.innerHTML = emptyRvsListPlaceholder;
        infoPoint.style.display = 'block';
     });
}

save.addEventListener('click', (e) => {
    if (!checkBeforeSave()) {
        return;
    }

    let placemark = new ymaps.Placemark(currCoords, {});

    let dataToStore = {
        ipAddr: ipAddr.innerText,
        rvUserName: rvUserName.value,
        rvPlaceName: rvPlaceName.value,
        rvText: rvText.value,
        dateTime: (new Date()).toLocaleString("ru")
    };

    placemark.properties.set('review', dataToStore);
    clusterer.add(placemark);

    if(rvsList.innerHTML == emptyRvsListPlaceholder) {
        rvsList.innerHTML = '';
    }
    rvsList.innerHTML += formatRvsList(dataToStore);

    resetInfoPoint();

    placemark.events.add('click', (e) => {

        clusterer.balloon.close();
        e.getSourceEvent().stopPropagation();
        infoPoint.style.display = 'block';

        currCoords = placemark.geometry._coordinates;

        let review = placemark.properties.get('review');

        ipAddr.innerText = review.ipAddr;
        rvsList.innerHTML = '';
        rvsList.innerHTML += formatRvsList(review);

    });
});

map.addEventListener('click', (e) => {
    infoPoint.style.left = `${e.clientX}px`;
    infoPoint.style.top = `${e.clientY}px`;
    putInOrderCords();
});

infoPointCloseBtn.addEventListener('click', (e) => {
    ipAddr.innerText = 'загрузка ...';
    infoPoint.style.display = 'none';
});

function baloonHrefClick(){
    const addr = document.querySelector('#baloonHref').innerText;

    clusterer.balloon.close();
    rvsList.innerHTML= '';

    ipAddr.innerText = addr;

    for (let gObj of currClusterGObjs) {
        let review = gObj.properties.get('review');

        if (review.ipAddr == addr) {
            rvsList.innerHTML += formatRvsList(review);
            currCoords = gObj.geometry._coordinates;
        }
    }

    infoPoint.style.display = 'block';
}

function formatRvsList(rvObj) {
    return `<p><b>${rvObj.rvUserName}</b> ${rvObj.rvPlaceName} ${rvObj.dateTime}<br>${rvObj.rvText}</p>`;
}

function checkBeforeSave() {

    if (
        rvUserName.value == '' ||
        rvPlaceName.value == '' ||
        rvText.value == ''
    ) {
        alert('Ошибка сохранения. Не заполнены все поля!');
        return false;
    }

    return true;
}

function resetInfoPoint() {
    rvUserName.value = '';
    rvPlaceName.value = '';
    rvText.value = '';
}

function putInOrderCords(){
    const ipBounding = infoPoint.getBoundingClientRect(),
        left = ipBounding.left,
        top = ipBounding.top,
        right = ipBounding.right,
        bottom = ipBounding.bottom;

    const clientWidth = document.documentElement.clientWidth,
        clientHeight = document.documentElement.clientHeight;

    const x = parseInt(infoPoint.style.left),
        y = parseInt(infoPoint.style.top);

    if (left < 0) {
        infoPoint.style.left = '10px';
    }

    if (top < 0) {
        infoPoint.style.top = '10px';
    }

    if (right > clientWidth) {
        infoPoint.style.left = `${x - (right - clientWidth) - 10 }px`;
    }

    if (bottom > clientHeight) {
        infoPoint.style.top = `${y - (bottom - clientHeight) - 10}px`;
    }
}