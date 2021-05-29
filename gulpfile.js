let project_folder = require("path").basename(__dirname); //папка выходного проекта
let source_folder = "#src"; //папка с исходниками
let fs = require('fs');

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/"
    },//пути вывода(выгрузка готовых файлов)
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        js: [source_folder + "/js/*.js", "!" + source_folder + "/js/_*.js"],
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf"
    },//пути файлов для работы
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },//пути файлов для постоянныго прослушивания
    clean: "./" + project_folder + "/" //удаление папки каждый раз при запуске gulp
}//объекты которые содержат пути к файлам и папкам

let { src, dest } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(), //плагин для перезагрузки страницы
    fileinclude = require("gulp-file-include"), //плагин для сборки множества файлов html в один
    del = require("del"), //плагин для удаления папки выходной папки 
    scss = require("gulp-sass"), //плагин для преобразования scss в css
    autoprefixer = require("gulp-autoprefixer"), //плагин для добавления вердорных профиксов в css
    group_media = require("gulp-group-css-media-queries"), //плагин для формирования одного медиа запроса из множества других
    clean_css = require('gulp-clean-css'), //плагин для чистки и сжатия css на выходе
    rename = require("gulp-rename"), //плагин для переименнования файлов
    uglify = require("gulp-uglify-es").default, //плагин для сжатия js файла
    babel = require('gulp-babel'), //плагин для форматирования js файла под старые браузеры
    imagemin = require('gulp-imagemin'), //плагин для сжатия картинок
    webp = require('gulp-webp'), //плагин для форматирования картинок в формат webp
    webphtml = require('gulp-webp-html'), //плагин для автонаписания кода html для webp
    webpcss = require("gulp-webpcss"), //плагин для автоподмены кода css для webp
    /* npm install webp-converter@2.2.3 --save-dev */
    svgSprite = require('gulp-svg-sprite'), //плагин для создания svg спрайтов
    svgmin = require('gulp-svgmin'), //плагин для минификации svg
    svgdel = require('gulp-cheerio'), //плагин для удаление лишних атрибутов из svg
    svgreplace = require('gulp-replace'), //плагин для фиксинга некоторых багов svg
    svgcache = require('gulp-cache'),
    ttf2woff = require('gulp-ttf2woff'), //плагин для конвертации штифтов
    ttf2woff2 = require('gulp-ttf2woff2'), //плагин для конвертации штифтов 
    fonter = require('gulp-fonter'); //плагин для конвертации штифтов otf в ttf


function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },//папка для отображения в браузере
        port: 3000,//порт по которуму будет открываться ссылка в браузере
        notify: false //отключение уведомления о том что браузер обновился
    })
} //функция для обновления страницы 

function html() {
    return src(path.src.html) //получение html файла для преобразования
        .pipe(fileinclude()) //сборка множества файлов html в один
        .pipe(webphtml()) //автонаписания кода html для webp
        .pipe(dest(path.build.html)) //путь сохранения html файла
        .pipe(browsersync.stream())  //обновление страницы после кажного изменения файла
}//функция для работы в html файлами 

function css() {
    return src(path.src.css) //получение scss файла для преобразования
        .pipe(
            scss({
                outputStyle: "expanded" //для формирования не сжатого css
            })) //преобразования scss в css
        .pipe(group_media()) //объединение медиа запросов
        .pipe(
            autoprefixer({
                grid: true,
                overrideBrowserslist: ["last 5 version"], //поддержка браузеров (последних 5 версий)
                cascade: true //стиль написания автопрефиксов
            })) //добавление префиксов
        .pipe(webpcss({
            webpClass: '.webp',
            noWebpClass: '.no-webp'
        })) //автоподмена кода css для webp 
        .pipe(dest(path.build.css)) //путь сохранения не сжатого css файла
        .pipe(clean_css()) //чистка и сжатие 
        .pipe(rename({
            extname: ".min.css"
        })) //переименнование css файла в style.min.css 
        .pipe(dest(path.build.css)) //путь сохранения сжатого css файла
        .pipe(browsersync.stream())  //обновление страницы после кажного изменения файла
}//функция для работы в css файлами 

function js() {
    return src(path.src.js) //получение js файла для преобразования
        .pipe(fileinclude()) //сборка множества файлов js в один
        .pipe(babel({
            presets: ['@babel/env']
        })) //форматирования файла под старые браузеры
        .pipe(dest(path.build.js)) //путь сохранения не сжатого js файла
        .pipe(uglify()) //сжатие js файла
        .pipe(rename({
            extname: ".min.js"
        })) //переименнование js файла в script.min.js 
        .pipe(dest(path.build.js)) //путь сохранения сжатого js файла
        .pipe(browsersync.stream())  //обновление страницы после кажного изменения файла
}//функция для работы в js файлами 

function images() {
    return src(path.src.img) //получение img файла для преобразования
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img)) //путь сохранения webp картинки
        .pipe(src(path.src.img)) //получение img файла для сжатия
        .pipe(imagemin({
            interlaced: true,
            progressive: true,
            optimizationLevel: 3, // 0 - 7
            svgoPlugins: [{ removeViewBox: false }]
        }))
        .pipe(dest(path.build.img)) //путь сохранения img файла
        .pipe(browsersync.stream())  //обновление страницы после кажного изменения файла
}//функция для работы в img файлами 

function fonts(params) {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}//функция преобразования ttf шрифтов

gulp.task('otf2ttf', function () {
    return gulp.src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'));
})//функция преобразования otf шрифтов

gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        // minify svg
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        // remove all fill, style and stroke declarations in out shapes
        .pipe(svgdel({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))
        // cheerio plugin create unnecessary string '&gt;', so replace it.
        .pipe(svgreplace('&gt;', '>'))
        // build svg sprite
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg", //имя файла спрайта
                    //example: true
                }
            }
        }))
        .pipe(dest(project_folder + "/img/icons/"))
})// функция для создания svg спрайтов svg4everybody({});

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}//функция подключения шрифтов к css
function cb() { }

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}//функция для отслеживания измениий в файлах

function clean() {
    return del(path.clean);
}//функция для удаление выходной папки

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync); //сценарий выполнения gulp

//для понимания gulp
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;