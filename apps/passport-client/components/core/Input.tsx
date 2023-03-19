import styled from "styled-components";

export const BigInput = styled.input`
  width: 100%;
  height: 46px;
  border-radius: 46px;
  padding: 12px;
  font-size: 1.15rem;
  font-weight: 300;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #fff;
  text-align: center;
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;
