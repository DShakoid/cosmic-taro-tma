(async function loader() {
    const scripts = [
        '/taro/taroLogic.js', // Сначала грузим переменные и функции логики
        '/taro/main.js'      // Затем основной код, который их использует
    ];

    for (const src of scripts) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
})();
