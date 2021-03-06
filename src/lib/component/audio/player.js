/**
 * 音频播放
 * @param  {[type]} global [description]
 * @return {[type]}        [description]
 */
import { config } from '../../config/index'
import AudioSuper from './super'
import { hasAudioes, getAudio } from './fix'

let instance = {} //存放不同音轨的一个实例
let audioPlayer

const createPart = (length) => {
  let uuidpart = ""
  let uuidchar
  for (let i = 0; i < length; i++) {
    uuidchar = parseInt((Math.random() * 256), 10).toString(16);
    if (uuidchar.length == 1) {
      uuidchar = "0" + uuidchar;
    }
    uuidpart += uuidchar;
  }
  return uuidpart;
}

const createUUID = () => [4, 2, 2, 2, 6].map(createPart).join('-')

/*获取音频文件路径*/
const getAudioPath = function (url) {
  return config.getAudioPath() + url
}


/**
 * 采用Falsh播放
 */
class _Flash extends AudioSuper {

  constructor(options, controlDoms) {
    super()

    let url = getAudioPath(options.url)
    let self = this

    //构建之前处理
    this.$$preRelated(options.trackId, options);

    let audio = new Audio5js({
      swf_path: './lib/data/audio5js.swf',
      throw_errors: true,
      format_time: true,
      ready: function () {
        this.load(url);
        //如果调用了播放
        this.play()
        self.status = "playing"
      }
    });

    this.audio = audio;
    this.trackId = options.trackId;
    this.status = 'playing';
    this.options = options;

    this.isFlash = true;

    //相关数据
    this.$$afterRelated(options, controlDoms);
  }

  /**
   * Compatible with asynchronous
   * for subitile use
   * get audio
   * @return {[type]} [description]
   */
  getAudioTime(callback) {
    callback(Math.round(this.audio.audio.audio.currentTime * 1000))
  }

  play() {
    this.$$play()
  }

  pause() {
    this.$$pause()
  }

  end() {
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
    this.$$destroy()
  }
}


/**
 * 采用_Audio5js播放
 */
class _Audio5js extends AudioSuper {

  constructor(options, controlDoms) {
    super()

    let url = getAudioPath(options.url)
    let self = this

    //构建之前处理
    this.$$preRelated(options.trackId, options);

    let audio = new Audio5js({
      ready: function (player) {
        this.load(url);
        //如果调用了播放
        this.play()
        self.status = "playing"
      }
    });

    this.audio = audio;
    this.trackId = options.trackId;
    this.status = 'playing';
    this.options = options;

    //相关数据
    this.$$afterRelated(options, controlDoms);
  }

  /**
   * Compatible with asynchronous
   * for subitile use
   * get audio
   * @return {[type]} [description]
   */
  getAudioTime(callback) {
    callback(Math.round(this.audio.audio.audio.currentTime * 1000))
  }

  play() {
    this.$$play()
  }

  pause() {
    this.$$pause()
  }

  end() {
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
    this.$$destroy()
  }
}


/**
 * 使用PhoneGap的Media播放
 */
class _Media extends AudioSuper {

  constructor(options, controlDoms) {
    super()

    let url = getAudioPath(options.url)
    let self = this

    //构建之前处理
    this.$$preRelated(options.trackId, options);

    //音频成功与失败调用
    let audio = new window.GLOBALCONTEXT.Media(url, () => {
      self.$$callbackProcess(true);
    }, () => {
      self.$$callbackProcess(true);
    })

    //autoplay
    this.audio = audio;
    this.trackId = options.trackId;
    this.options = options;

    //相关数据
    this.$$afterRelated(options, controlDoms)

    this.play()
  }

  /**
   * Compatible with asynchronous
   * for subitile use
   * get audio
   * @return {[type]} [description]
   */
  getAudioTime(callback) {
    this.audio.getCurrentPosition((position) => {
      let audioTime
      position = position * 1000;
      if (!this.changeValue) {
        this.changeValue = position
      }
      position -= this.changeValue;
      if (position > -1) {
        audioTime = Math.round(position);
      }
      callback(audioTime)
    }, (e) => {
      console.log("error:" + e);
      //出错继续检测
      callback()
    })
  }

  play() {
    this.$$play()
  }

  pause() {
    this.$$pause()
  }

  /**
   * 取反
   * @return {[type]} [description]
   */
  end() {
    if (this.audio) {
      this.audio.release();
      this.audio = null;
    }
    this.$$destroy()
  }
}


/**
 * 使用PhoneGap的 js直接调用 cordova Media播放
 */
class _cordovaMedia extends AudioSuper {

  constructor(options, controlDoms) {
    super()

    let url = getAudioPath(options.url)
    let self = this

    this.id = createUUID();

    //构建之前处理
    this.$$preRelated(options.trackId, options);

    let audio = {
      startPlayingAudio: function () {
        window.audioHandler.startPlayingAudio(self.id, url)
      },
      pausePlayingAudio: function () {
        window.audioHandler.pausePlayingAudio(self.id)
      },
      release: function () {
        window.audioHandler.release(self.id)
      },
      /**
       * 扩充，获取位置
       * @return {[type]} [description]
       */
      expansionCurrentPosition: function () {
        return window.getCurrentPosition(self.id)
      }
    }

    //autoplay
    this.audio = audio;
    this.trackId = options.trackId;
    this.options = options;

    //相关数据
    this.$$afterRelated(options, controlDoms)

    this.play()
  }


  /**
   * Compatible with asynchronous
   * for subitile use
   * get audio
   * @return {[type]} [description]
   */
  getAudioTime(callback) {
    callback(Math.round(this.audio.expansionCurrentPosition() * 1000))
  }


  //播放
  play() {
    if (this.audio) {
      this.audio.startPlayingAudio();
    }
    this.$$play()
  }

  //停止
  pause() {
    this.audio && this.audio.pausePlayingAudio();
    this.$$pause()
  }


  //结束
  end() {
    if (this.audio) {
      this.audio.release();
      this.audio = null;
    }
    this.$$destroy()
  }
}


/**
 * 使用html5的audio播放
 * 1-支持audio的autoplay，大部分安卓机子的自带浏览器和微信，大部分的IOS微信（无需特殊解决）
 * 2-不支持audio的autoplay，部分的IOS微信
 * 3-不支持audio的autoplay，部分的安卓机子的自带浏览器（比如小米，开始模仿safari）和全部的ios safari（这种只能做用户触屏时就触发播放了）
 */
class _nativeVideo extends AudioSuper {

  constructor(options, controlDoms) {

    super()

    let audio
    let self = this
    let trackId = options.trackId

    let hasAudio = hasAudioes()
    let url = getAudioPath(options.url)

    //构建之前处理
    this.$$preRelated(trackId, options);

    if (instance[trackId]) {
      audio = hasAudio ? getAudio() : instance[trackId]
      audio.src = url
    } else {
      if (hasAudio) {
        audio = getAudio()
        audio.src = url
      } else {
        audio = new Audio(url)
          //更新音轨
          //妙妙学方式不要音轨处理
        if (trackId) {
          instance[trackId] = audio
        }
      }
    }

    this._callback = () => {
      this.$$callbackProcess()
    }

    //自动播放，只处理一次
    //手动调用的时候会调用play的时候会调用canplay
    //导致重复播放，所以在第一次的去掉这个事件
    this._canplayCallback = () => {
      this.play()
      this.audio && this.audio.removeEventListener('canplay', this._canplayCallback, false)
    }

    /**
     * safari 自动播放
     * 手机浏览器需要加
     * 2016.8.26
     * @type {Boolean}
     */
    audio.autoplay = true

    audio.addEventListener('canplay', this._canplayCallback, false)
    audio.addEventListener('ended', this._callback, false)
    audio.addEventListener('error', this._callback, false)

    this.audio = audio;
    this.trackId = trackId;
    this.status = 'playing';
    this.options = options;

    //相关数据
    this.$$afterRelated(options, controlDoms)
  }

  /**
   * Compatible with asynchronous
   * for subitile use
   * get audio
   * @return {[type]} [description]
   */
  getAudioTime(callback) {
    callback(Math.round(this.audio.currentTime * 1000))
  }

  play() {
    this.$$play()
  }

  pause() {
    this.$$pause()
  }

  end() {
    if (this.audio) {
      this.audio.pause();
      //快速切换，防止在播放中就移除，导致没有销毁
      this.audio.removeEventListener('canplay', this._canplayCallback, false)
      this.audio.removeEventListener('ended', this._callback, false)
      this.audio.removeEventListener('error', this._callback, false)
      this.audio = null;
    }
    this.$$destroy()
  }
}



/*安卓客户端apk的情况下*/
if (Xut.plat.isAndroid && !Xut.plat.isBrowser) {
  audioPlayer = _Media
} else {
  /*妙妙学的 客户端浏览器模式*/
  if (window.MMXCONFIG && window.audioHandler) {
    audioPlayer = _cordovaMedia
  } else {
    /*其余所有情况都用原声的H5播放器*/
    audioPlayer = _nativeVideo
  }
}


export { audioPlayer }
