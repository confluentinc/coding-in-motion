import { BoxGeometry, Clock, Color, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, SpotLight, Vector3, WebGLRenderer } from "three";
import { lerp } from "three/src/math/MathUtils";

// Create scene.
const scene = new Scene();
scene.background = new Color("aliceblue");

// Add lights.
const spotlight = new SpotLight("white");
spotlight.position.set(1, 4, 9);
scene.add(spotlight);

// Add things.
const blocks: Mesh[] = [];
const MAX_CHANNELS = 8;

for (var i = 0; i < MAX_CHANNELS; i++) {
    const block = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshStandardMaterial()
    );
    const row = Math.floor(i / 4);
    const column = i % 4;
    block.material.color.setHSL(i / MAX_CHANNELS, 0.8, 0.5);
    block.position.set(
        2 * column,
        0.5,
        2 * row,
    );
    scene.add(block);

    blocks.push(block);
}

const floor = new Mesh(
    new PlaneGeometry(50, 50),
    new MeshStandardMaterial({ color: "linen" })
);
floor.rotateX(Math.PI / -2);
scene.add(floor);


// Add camera.
const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(1, 7, 10);
camera.lookAt(new Vector3(3, 4, 0));

// Render.
const canvas = document.getElementById("three");

if (canvas) {
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const clock = new Clock();

    const tick = () => {
        const delta = clock.getDelta();

        renderer.render(scene, camera);

        blocks.forEach((block: Mesh) => {
            block.rotateY(delta);

            const midiNote = block.userData.midiNote;
            if (midiNote) {
                const oldY = block.position.y;
                const newY = Math.max(midiNote.PITCH - 30, 0) / 5;

                block.position.setY(lerp(oldY, newY, 0.1));
            }
        });

        window.requestAnimationFrame(tick);
    };
    tick();
}

const websocket = new WebSocket("ws://localhost:8080");

websocket.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    console.log("GOT", payload);

    if (blocks[payload.value.CHANNEL]) {
        blocks[payload.value.CHANNEL].userData = {
            midiNote: payload.value
        };
    }

}
