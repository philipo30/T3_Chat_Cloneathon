import React from 'react';
import styled from 'styled-components';

const VoiceInput = () => {
  return (
    <StyledWrapper>
      <div className="AI-Input">
        <input type="file" id="camera" accept="image/*" capture="environment" />
        <input type="file" id="photos" accept="image/*" />
        <input type="file" id="files" />
        <input id="voice" type="checkbox" />
        <label htmlFor="voice">
          <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--neutral-color)" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
          </svg>
        </label>
        <input id="mic" type="checkbox" />
        <label htmlFor="mic">
          <svg viewBox="0 0 16 16" fill="var(--neutral-color)" height={30} width={30} xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
            <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--neutral-color)" viewBox="0 0 16 16">
            <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879l-1-1V3a2 2 0 0 0-3.997-.118l-.845-.845A3.001 3.001 0 0 1 11 3" />
            <path d="m9.486 10.607-.748-.748A2 2 0 0 1 6 8v-.878l-1-1V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z" />
          </svg>
        </label>
        <div className="chat-marquee">
          <ul>
            <li>Create an image</li>
            <li>Give me ideas</li>
            <li>Write a text</li>
            <li>Create a chart</li>
            <li>Plan a trip</li>
            <li>Help me pick</li>
            <li>Write a Python script</li>
          </ul>
          <ul>
            <li>Create an image</li>
            <li>Give me ideas</li>
            <li>Write a text</li>
            <li>Create a chart</li>
            <li>Plan a trip</li>
            <li>Help me pick</li>
            <li>Write a Python script</li>
          </ul>
        </div>
        <div className="chat-container">
          <label htmlFor="chat-input" className="chat-wrapper">
            <textarea id="chat-input" placeholder="Ask anything" defaultValue={""} />
            <div className="button-bar">
              <div className="left-buttons">
                <input id="appendix" type="checkbox" />
                <label htmlFor="appendix">
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="var(--neutral-color)" viewBox="0 0 16 16">
                    <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                  </svg>
                </label>
                <div id="appendix-bar">
                  <label htmlFor="appendix">
                    <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--primary-color)" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                    </svg>
                  </label>
                  <label htmlFor="camera">
                    <svg viewBox="0 0 16 16" fill="var(--primary-color)" height={30} width={30} xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
                      <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
                    </svg>
                  </label>
                  <label htmlFor="photos">
                    <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--primary-color)" viewBox="0 0 16 16">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z" />
                    </svg>
                  </label>
                  <label htmlFor="files">
                    <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--primary-color)" viewBox="0 0 16 16">
                      <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139q.323-.119.684-.12h5.396z" />
                    </svg>
                  </label>
                </div>
                <input id="search" type="checkbox" />
                <label htmlFor="search">
                  <svg viewBox="0 0 16 16" fill="var(--neutral-color)" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855q-.215.403-.395.872c.705.157 1.472.257 2.282.287zM4.249 3.539q.214-.577.481-1.078a7 7 0 0 1 .597-.933A7 7 0 0 0 3.051 3.05q.544.277 1.198.49zM3.509 7.5c.036-1.07.188-2.087.436-3.008a9 9 0 0 1-1.565-.667A6.96 6.96 0 0 0 1.018 7.5zm1.4-2.741a12.3 12.3 0 0 0-.4 2.741H7.5V5.091c-.91-.03-1.783-.145-2.591-.332M8.5 5.09V7.5h2.99a12.3 12.3 0 0 0-.399-2.741c-.808.187-1.681.301-2.591.332zM4.51 8.5c.035.987.176 1.914.399 2.741A13.6 13.6 0 0 1 7.5 10.91V8.5zm3.99 0v2.409c.91.03 1.783.145 2.591.332.223-.827.364-1.754.4-2.741zm-3.282 3.696q.18.469.395.872c.552 1.035 1.218 1.65 1.887 1.855V11.91c-.81.03-1.577.13-2.282.287zm.11 2.276a7 7 0 0 1-.598-.933 9 9 0 0 1-.481-1.079 8.4 8.4 0 0 0-1.198.49 7 7 0 0 0 2.276 1.522zm-1.383-2.964A13.4 13.4 0 0 1 3.508 8.5h-2.49a6.96 6.96 0 0 0 1.362 3.675c.47-.258.995-.482 1.565-.667m6.728 2.964a7 7 0 0 0 2.275-1.521 8.4 8.4 0 0 0-1.197-.49 9 9 0 0 1-.481 1.078 7 7 0 0 1-.597.933M8.5 11.909v3.014c.67-.204 1.335-.82 1.887-1.855q.216-.403.395-.872A12.6 12.6 0 0 0 8.5 11.91zm3.555-.401c.57.185 1.095.409 1.565.667A6.96 6.96 0 0 0 14.982 8.5h-2.49a13.4 13.4 0 0 1-.437 3.008M14.982 7.5a6.96 6.96 0 0 0-1.362-3.675c-.47.258-.995.482-1.565.667.248.92.4 1.938.437 3.008zM11.27 2.461q.266.502.482 1.078a8.4 8.4 0 0 0 1.196-.49 7 7 0 0 0-2.275-1.52c.218.283.418.597.597.932m-.488 1.343a8 8 0 0 0-.395-.872C9.835 1.897 9.17 1.282 8.5 1.077V4.09c.81-.03 1.577-.13 2.282-.287z" />
                  </svg>
                </label>
              </div>
              <div className="right-buttons">
                <label htmlFor="voice">
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="var(--neutral-color)" viewBox="0 0 16 16">
                    <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                    <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
                  </svg>
                </label>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="var(--neutral-color)" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0m-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707z" />
                  </svg>
                </button>
              </div>
            </div>
          </label>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .AI-Input {
    --primary-color: #2e2e2e;
    --neutral-color: #d3d3d3;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: relative;
    width: 90%;
    min-width: 20em;
    max-width: 40em;
    user-select: none;
    z-index: -3;
  }

  #voice {
    display: none;

    & + label {
      margin-right: 5rem;
      transition: all 0.2s ease-in-out;
    }

    &:checked {
      & ~ label {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;

        &:first-of-type {
          transition: all 0.2s 0.2s ease-in-out;
        }

        &:last-of-type {
          transition: all 0.2s 0.1s ease-in-out;
        }
      }

      & ~ .chat-marquee {
        opacity: 0;
        transform: translateY(-300%) scale(0.9);
      }

      & ~ .chat-container {
        width: 9rem;
        height: 9rem;
        top: -6em;
        border-radius: 10%;
        transform-style: preserve-3d;
        animation: rotate-cube 8s 0.2s linear infinite;

        & > .chat-wrapper {
          opacity: 0;
          pointer-events: none;
        }

        &:active {
          scale: 0.9;
        }
      }
    }
  }

  #mic {
    display: none;

    & + label {
      margin-left: 5rem;
      width: 62px;
      aspect-ratio: 1 / 1;
      transition: all 0.2s ease-in-out;

      & > svg {
        position: absolute;
        transition: all 0.2s ease-in-out;

        &:first-of-type {
          opacity: 1;
        }

        &:last-of-type {
          opacity: 0;
          fill: rgba(255, 0, 0, 0.5);
        }
      }
    }

    &:checked + label {
      background-color: rgba(255, 0, 0, 0.1);

      & > :first-child {
        opacity: 0;
      }

      & > :last-child {
        opacity: 1;
      }
    }
  }

  #voice + label,
  #mic + label {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 0;
    padding: 1rem;
    background-color: var(--primary-color);
    border-radius: 50%;
    opacity: 0;
    cursor: pointer;
    pointer-events: none;
    transform: translateY(100%);
  }

  .chat-marquee {
    --gap: 1em;
    display: flex;
    gap: var(--gap);
    margin-bottom: 1rem;
    width: 100%;
    mask-image: linear-gradient(
      to right,
      rgba(0, 0, 0, 0),
      rgba(0, 0, 0, 1) 20%,
      rgba(0, 0, 0, 1) 80%,
      rgba(0, 0, 0, 0)
    );
    overflow: hidden;
    transition: all 0.2s ease-in-out;

    & > ul {
      display: flex;
      gap: var(--gap);
      flex-shrink: 0;
      justify-content: space-around;
      list-style: none;
      animation: scroll-marquee-left 30s linear infinite;

      & > li {
        padding: 0.5rem 1rem;
        background-color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 10px;
        color: var(--neutral-color);
        font-weight: 700;
        cursor: pointer;
        transition:
          all 0.2s ease-in-out,
          transform 0.1s ease-in-out;

        &:hover {
          background-color: var(--neutral-color);
          color: var(--primary-color);
        }

        &:active {
          transform: scale(0.9);
        }
      }
    }

    &:hover > ul {
      animation-play-state: paused !important;
    }
  }

  .chat-container {
    position: relative;
    top: 0;
    width: 100%;
    background: var(--primary-color);
    border: 0.2rem solid rgba(255, 255, 255, 0.3);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.3, 1.5, 0.6, 1);
    z-index: -2;

    &::before {
      content: "";
      position: absolute;
      top: -9rem;
      left: -6rem;
      width: 15rem;
      height: 15rem;
      background: radial-gradient(
        circle,
        #fff 10%,
        rgba(255, 255, 255, 0.1) 20%,
        var(--primary-color) 100%
      );
      filter: blur(10px);
      border-radius: 50%;
      z-index: -1;
      transition: all 1s cubic-bezier(0.3, 1.5, 0.6, 1);
    }

    &:focus-within::before {
      top: -6rem;
      left: 50%;
      filter: blur(50px);
    }
  }

  .chat-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 1rem;
    z-index: 200;
    transition: all 0.2s ease-in-out;
  }

  #chat-input {
    padding: 0.6rem;
    width: 100%;
    min-height: 3rem;
    max-height: 10rem;
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    line-height: 1.5;
    outline: none;
    resize: none;
    animation: typing-effect 3s steps(30, end) infinite alternate;

    &::placeholder {
      color: var(--neutral-color);
    }

    &::-webkit-scrollbar {
      width: 0.7rem;
      border-radius: 9999px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--primary-color);
      border: 0.2rem solid var(--neutral-color);
      border-radius: 9999px;
    }

    &::-webkit-scrollbar-track {
      background-color: var(--neutral-color);
      border-radius: 9999px;
    }
  }

  .button-bar {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    width: 100%;
  }

  .left-buttons {
    display: flex;
    gap: 0.5rem;

    & > label {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 0.2rem solid rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      cursor: pointer;
      transition:
        all 0.2s ease-in-out,
        transform 0.1s ease-in-out;

      &:hover {
        box-shadow: 0.2rem 0.2rem 0.5rem 0.2rem rgba(0, 0, 0, 0.2);
      }

      &:active {
        transform: scale(0.9);
      }
    }
  }

  #appendix,
  #camera,
  #photos,
  #files {
    display: none;
  }

  #appendix:checked ~ #appendix-bar {
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    pointer-events: all;
    transition: all 0.2s ease-in-out;

    & > label,
    & > button {
      opacity: 1;
      transform: translate(0);
    }
  }

  #appendix-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 1rem;
    overflow: hidden;
    pointer-events: none;
    z-index: 100;
    transition: all 0.2s 0.4s ease-in-out;

    & > label {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      background-color: var(--neutral-color);
      border-radius: 50%;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease-in-out;
      transform: translate(-50%, 200%);
    }

    & > :nth-child(1) {
      transition-delay: 0.1s;
    }

    & > :nth-child(2) {
      transition-delay: 0.2s;
    }

    & > :nth-child(3) {
      transition-delay: 0.3s;
    }

    & > :nth-child(4) {
      transition-delay: 0.4s;
    }
  }

  #search {
    display: none;

    &:checked + label {
      border: 2px solid lightskyblue;

      & > svg {
        fill: lightskyblue;
      }
    }
  }

  .right-buttons {
    display: flex;
    gap: 1rem;

    & > label,
    & > button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      &:hover {
        transform: translateY(-10%) scale(1.1);
      }
    }

    & > label {
      top: 0.5rem;
    }
  }

  @keyframes rotate-cube {
    0% {
      transform: rotateX(0deg) rotateY(0deg);
    }
    25% {
      transform: rotateX(90deg) rotateY(90deg);
    }
    50% {
      transform: rotateX(180deg) rotateY(180deg);
    }
    75% {
      transform: rotateX(270deg) rotateY(270deg);
    }
    100% {
      transform: rotateX(360deg) rotateY(360deg);
    }
  }

  @keyframes scroll-marquee-left {
    to {
      transform: translateX(calc(-100% - var(--gap)));
    }
  }`;

export default VoiceInput; 