
var monkey = {
  videos: {
    sd: '',
    hd: '',
    shd: '',
  },
  types: {
    sd: '标清',
    hd: '高清',
    shd: '超清',
  },
  title: '',
  subs: {
  },

  run: function() {
    var type;

    this.getTitle();
    if (uw.document.title.search('网易公开课') > -1) {
      this.getOpenCourseSource();
    } else {
      this.getSource();
    }
  },

  getTitle: function() {
    this.title = uw.document.title;
  },

  getOpenCourseSource: function() {
    log('getOpenCourseSource()')
    var url = uw.document.location.href.split('/'),
        length = url.length,
        xmlUrl,
        that = this;

    xmlUrl = [
      'http://live.ws.126.net/movie',
      url[length - 3],
      url[length - 2],
      '2_' + url[length - 1].replace('html', 'xml'),
      ].join('/');
    log('xmlUrl: ', xmlUrl);
    GM_xmlhttpRequest({
      method: 'GET',
      url: xmlUrl,
      onload: function(response) {
        log(response);
        var xml = that.parseXML(response.responseText),
            type,
            video,
            subs,
            sub,
            subName,
            i;

        //that.title = xml.querySelector('all title').innerHTML;
        that.title = uw.document.title.replace('_网易公开课', '');
        for (type in that.videos) {
          video = xml.querySelector('playurl_origin ' + type +' mp4');
          if (video) {
            that.videos[type] = video.firstChild.data;
            continue;
          }
          video = xml.querySelector(
            'playurl_origin ' + type.toUpperCase() +' mp4');
          if (video) {
            that.videos[type] = video.firstChild.data;
          }
        }
        subs = xml.querySelectorAll('subs sub');
        for (i = 0; sub = subs[i]; i += 1) {
          subName = sub.querySelector('name').innerHTML + '字幕';
          that.subs[subName] = sub.querySelector('url').innerHTML;
        }
        that.createUI();
      },
    });
  },

  getSource: function() {
    log('getSource()');
    var scripts = uw.document.querySelectorAll('script'),
        script,
        reg = /<source[\s\S]+src="([^"]+)"/,
        match,
        m3u8Reg = /appsrc\:\s*'([\s\S]+)\.m3u8'/,
        m3u8Match,
        i;
    for (i = 0; script = scripts[i]; i += 1) {
      match = reg.exec(script.innerHTML);
      log(match);
      if (match && match.length > 1) {
        this.videos.sd = match[1].replace('-mobile.mp4', '.flv');
        this.createUI();
        return true;
      }
      m3u8Match = m3u8Reg.exec(script.innerHTML);
      log(m3u8Match);
      if (m3u8Match && m3u8Match.length > 1) {
        this.videos.sd = m3u8Match[1].replace('-list', '') + '.mp4';
        this.createUI();
        return true;
      }
    }
  },

  createUI: function() {
    log('createUI() --');
    log(this);

    var panel = uw.document.createElement('div'),
        type,
        subName,
        a;

    this.addStyle([
        '.download-wrap { ',
          'position: fixed; ',
          'left: 10px; ',
          'bottom: 10px; ',
          'border: 2px solid #ccc; ',
          'border-top-right-radius: 15px; ',
          'margin; 0; ',
          'padding: 10px; ',
          'background-color: #fff; ',
          'z-index: 9999; ',
          '}',
        '.download-link { ',
          'display: block;',
          'margin: 8px;',
          '}',
        '.download-link:hover { ',
          'text-decoration: underline; ',
          '}',
        '.download-link:active {',
          'color: #e03434; ',
          'outline: none; ',
          '}',
        ].join(''));

    for (type in this.videos) {
      if (this.videos[type] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.videos[type];
      a.innerHTML = this.title + '-' + this.types[type];
      a.className = 'download-link';
      panel.appendChild(a);
    }

    for (subName in this.subs) {
      if (this.subs[subName] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.subs[subName];
      a.innerHTML = this.title + '-' + subName;
      a.className = 'download-link';
      panel.appendChild(a);
    }

    panel.className = 'download-wrap';
    uw.document.body.appendChild(panel);
  },

  /**
   * Convert string to xml
   * @param string str
   *  - the string to be converted.
   * @return object xml
   *  - the converted xml object.
   */
  parseXML: function(str) {
    if (uw.document.implementation &&
        uw.document.implementation.createDocument) {
      xmlDoc = new DOMParser().parseFromString(str, 'text/xml');
    } else {
      log('parseXML() error: not support current web browser!');
      return null;
    }
    return xmlDoc;
  },

};

monkey.run();
