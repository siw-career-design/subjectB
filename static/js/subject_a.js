// 楽曲データ
const songs = [
    {
        title: "ビットで覚える基本情報",
        file: "./static/music/ビットで覚える基本情報.mp3"
    },
    {
        title: "ヒップホップ-男性vo.-ネットワーク",
        file: "./static/music/ヒップホップ-男性vo.-ネットワーク.mp3"
    },
    {
        title: "プロジェクトマネジメントをテーマにした楽曲_Mission Complete ～PMの羅針盤～",
        file: "./static/music/プロジェクトマネジメントをテーマにした楽曲_Mission Complete ～PMの羅針盤～.mp3"
    },
    {
        title: "ロック-男性vo-セキュリティ",
        file: "./static/music/ロック-男性vo-セキュリティ.mp3"
    },
    {
        title: "ロック-男性vo-ネットワーク",
        file: "./static/music/ロック-男性vo-ネットワーク.mp3"
    },
    {
        title: "基本情報シャウト！",
        file: "./static/music/基本情報シャウト！.mp3"
    },
    {
        title: "基本情報技術者試験ずんだーセキュリティ",
        file: "./static/music/基本情報技術者試験ずんだーセキュリティ.mp3"
    },
    {
        title: "基本情報技術者試験ずんだーネットワーク",
        file: "./static/music/基本情報技術者試験ずんだーネットワーク.mp3"
    },
    {
        title: "経営戦略手法をテーマにした楽曲_戦略の酒場",
        file: "./static/music/経営戦略手法をテーマにした楽曲_戦略の酒場.mp3"
    },
    {
        title: "標準化をテーマにした楽曲_Connect the World ～標準化のルール～",
        file: "./static/music/標準化をテーマにした楽曲_Connect the World ～標準化のルール～.mp3"
    }
];

const musicList = document.getElementById("musicList");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlaying = document.getElementById("nowPlaying");

// 楽曲一覧を生成
songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <button class="play-btn">
            ▶ ${song.title}
        </button>
    `;

    li.querySelector("button").addEventListener("click", () => {
        audioPlayer.src = song.file;
        audioPlayer.play();
        nowPlaying.textContent = `再生中：${song.title}`;
    });

    musicList.appendChild(li);
});
