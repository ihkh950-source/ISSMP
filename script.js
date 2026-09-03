function copyIP() {

    const ip = document.getElementById("serverIP").innerText;

    navigator.clipboard.writeText(ip)
        .then(() => {

            const toast = document.getElementById("toast");

            toast.classList.add("show");

            setTimeout(() => {
                toast.classList.remove("show");
            }, 2000);

        })
        .catch(() => {

            alert("Server IP: " + ip);

        });
}
