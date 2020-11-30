/*

* はてなブログに「音読する」ボタンを追加する

** 使い方

- 以下をコピーして デザイン編集 → カスタマイズ → フッタHTML に貼り付け

<script async defer src="https://hitode909.github.io/hatenablog-unofficial-modules/speech.js"></script>

** 注意
- Web Speech API非対応のブラウザでは音読できません

*/

function speak (e) {
  speechSynthesis.cancel();

  // Chromeで初回実行時にspeechSynthesis.pause()できない問題を解消するため、空文字で一度speechSynthesis.speak()しておく
  var empty_utter = new SpeechSynthesisUtterance('');
  speechSynthesis.speak(empty_utter);

  var utter = new SpeechSynthesisUtterance(this.body);
  speechSynthesis.speak(utter);
  e.currentTarget.textContent = '停止する';
  e.currentTarget.removeEventListener('click', this);
  e.currentTarget.addEventListener('click', pause);
}

function pause (e) {
  speechSynthesis.pause();
  e.currentTarget.textContent = '再開する';
  e.currentTarget.removeEventListener('click', pause);
  e.currentTarget.addEventListener('click', resume);
}

function resume (e) {
  speechSynthesis.resume();
  e.currentTarget.textContent = '停止する';
  e.currentTarget.removeEventListener('click', resume);
  e.currentTarget.addEventListener('click', pause);
}

(function () {
  if (!window.speechSynthesis) return;
  document.querySelectorAll('article.entry').forEach(function (article) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = '音読する';
    button.style = 'float: right';
    article.querySelector('header').appendChild(button);
    var body = article.querySelector('.entry-content').textContent;
    button.addEventListener('click', { handleEvent: speak, body: body });
  });
})();
