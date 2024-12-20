import { useEffect, useLayoutEffect, useState } from 'react';
import rough from 'roughjs'

const roughGenerator = rough.generator();

export const WhiteBoard = ({
    canvasRef,
    ctxRef,
    elements,
    setElements,
    tool,
    color,
    user,
    socket
}) => {

    const [isDrawing, setIsDrawing] = useState(false);
    const [poly, setPolygon] = useState(false);
    const [local, setLocal] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.height = window.innerHeight * 2;
        canvas.width = window.innerWidth * 2;
        const ctx = canvas.getContext("2d");

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctxRef.current = ctx;
    }, []);

    useEffect(() => {
        ctxRef.current.strokeStyle = color;

    }, [color]);

    useEffect(() => {
        const handleReDraw = (data) => {
            console.log('Received reDraw data:', data);

            if (JSON.stringify(data) !== JSON.stringify(elements)) {
                setElements(data);
            }

            setLocal(false)
        };

        socket.on('reDraw', handleReDraw);

        return () => {
            socket.off('reDraw', handleReDraw);
        };
    }, [socket]);

    useEffect(() => {
        if (local) {
            socket.emit("reDraw", { elements, user });
        }

        setLocal(true)
    }, [elements])

    useLayoutEffect(() => {
        // console.log(elements);
        if (canvasRef) {

            const roughCanvas = rough.canvas(canvasRef.current)
            if (elements.length > 0) {
                ctxRef.current.clearRect(
                    0,
                    0,
                    canvasRef.current.width,
                    canvasRef.current.height
                )
            } else { return }
            elements.forEach((element) => {
                if (element.type == 'pencil') {
                    roughCanvas.linearPath(element.path, {
                        stroke: element.stroke,
                        strokeWidth: 2,
                        roughness: 0,
                    })
                } else if (element.type == 'line') {
                    roughCanvas.draw(
                        roughGenerator.line(
                            element.offsetX,
                            element.offsetY,
                            element.width,
                            element.height,
                            {
                                stroke: element.stroke,
                                strokeWidth: 2,
                                roughness: 0,
                            }
                        )
                    );
                } else if (element.type === "rect") {
                    roughCanvas.draw(
                        roughGenerator.rectangle(
                            element.offsetX,
                            element.offsetY,
                            element.width,
                            element.height,
                            {
                                stroke: element.stroke,
                                strokeWidth: 2,
                                roughness: 0,
                            }
                        )
                    );
                } else if (element.type === "poly") {
                    roughCanvas.draw(
                        roughGenerator.polygon(
                            element.vertices,
                            {
                                stroke: element.stroke,
                                strokeWidth: 2,
                                roughness: 0,
                            }
                        )
                    );
                } else if (element.type === "circle") {
                    roughCanvas.draw(
                        roughGenerator.circle(
                            element.x,
                            element.y,
                            element.diameter,
                            {
                                stroke: element.stroke,
                                strokeWidth: 2,
                                roughness: 0,
                            }
                        )
                    );
                }
            })
        }
    }, [elements])

    const handleMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;

        if (tool == 'pencil') {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "pencil",
                    offsetX,
                    offsetY,
                    path: [[offsetX, offsetY]],
                    stroke: color,
                },
            ]);
        } else if (tool == 'line') {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "line",
                    offsetX,
                    offsetY,
                    width: offsetX,
                    height: offsetY,
                    stroke: color,
                },
            ]);
        } else if (tool === "rect") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "rect",
                    offsetX,
                    offsetY,
                    width: 0,
                    height: 0,
                    stroke: color,
                },
            ]);
        } else if (tool === "poly") {
            if (poly) {
                setElements((prevElements) =>
                    prevElements.map((ele, index) => {
                        if (index === elements.length - 1) {
                            const firstVertex = ele.vertices[0];
                            const newVertex = [offsetX, offsetY];

                            if (firstVertex[0] === newVertex[0] && firstVertex[1] === newVertex[1]) {
                                setPolygon(false);
                                return
                            }
                            return {
                                ...ele,
                                width: offsetX - ele.offsetX,
                                height: offsetY - ele.offsetY,
                                vertices: [...ele.vertices, [offsetX, offsetY]]
                            };
                        } else {
                            return ele;
                        }
                    })
                );
                return
            }
            setPolygon(true);
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "poly",
                    vertices: [[offsetX, offsetY], [offsetX, offsetY]],
                    stroke: color,
                },
            ]);
        } else if (tool === "circle") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "circle",
                    offsetX,
                    offsetY,
                    x: offsetX,
                    y: offsetY,
                    diameter: 0,
                    stroke: color,
                },
            ]);
        }
        setIsDrawing(true)
    }

    const handleMouseMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        if (poly) {
            setElements((prevElements) =>
                prevElements.map((ele, index) => {
                    if (index === elements.length - 1) {
                        return {
                            ...ele,
                            width: offsetX - ele.offsetX,
                            height: offsetY - ele.offsetY,
                            vertices: [
                                ...ele.vertices.slice(0, -1),
                                [offsetX, offsetY]
                            ]
                        };
                    } else {
                        return ele;
                    }
                })
            );
        }
        else if (isDrawing) {

            if (tool == 'pencil') {
                const { path } = elements[elements.length - 1];
                const newPath = [...path, [offsetX, offsetY]];
                setElements((prevElements) =>
                    prevElements.map((ele, index) => {
                        if (index === elements.length - 1) {
                            return {
                                ...ele,
                                path: newPath,
                            };
                        } else {
                            return ele;
                        }
                    })
                );
            } else if (tool == 'line') {
                setElements((prevElements) =>
                    prevElements.map((ele, index) => {
                        if (index === elements.length - 1) {
                            return {
                                ...ele,
                                width: offsetX,
                                height: offsetY,
                            };
                        } else {
                            return ele;
                        }
                    })
                );
            } else if (tool === "rect") {
                setElements((prevElements) =>
                    prevElements.map((ele, index) => {
                        if (index === elements.length - 1) {
                            return {
                                ...ele,
                                width: offsetX - ele.offsetX,
                                height: offsetY - ele.offsetY,
                            };
                        } else {
                            return ele;
                        }
                    })
                );
            } else if (tool === "circle") {
                setElements((prevElements) =>
                    prevElements.map((ele, index) => {
                        if (index === elements.length - 1) {
                            var diameter = calculateDiameter(offsetX, offsetY, ele.offsetX, ele.offsetY);
                            return {
                                ...ele,
                                x: (offsetX + ele.offsetX) / 2,
                                y: (offsetY + ele.offsetY) / 2,
                                diameter,
                            };
                        } else {
                            return ele;
                        }
                    })
                );
            }
        }
    }

    const calculateDiameter = (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    const handleMouseUp = () => {
        // console.log(elements)
        setIsDrawing(false);
    }

    const handleDoubleClick = () => {
        setPolygon(false)
    }

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="border border-dark border-1 h-100 w-100 overflow-hidden"
        >
            <canvas ref={canvasRef} />
        </div>
    )
}


