document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".coming-soon-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault(); // ← 画面遷移を止める
            alert("準備中です。実装をお待ちください。");
        });
    });
});
