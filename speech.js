/*

* はてなブログに「音読する」ボタンを追加する

** 使い方

- 以下をコピーして デザイン編集 → カスタマイズ → フッタHTML に貼り付け

<script async defer src="https://hitode909.github.io/hatenablog-unofficial-modules/speech.js"></script>

** 注意
- Web Speech API非対応のブラウザでは音読できません

*/

(function () {
  if (!window.speechSynthesis) return;
  document.querySelectorAll('article').forEach(function (article) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = '音読する';
    button.style = 'float: right';
    article.querySelector('header').appendChild(button);
    button.addEventListener('click', function () {
      var synth = window.speechSynthesis;
      var body = article.querySelector('.entry-content').textContent;
      var utter = new SpeechSynthesisUtterance(body);
      synth.speak(utter);
    });
  });
})();
