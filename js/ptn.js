function parsePTN(text) {
  text = text.replace(/\r/g, '');
  text = text.replace(/\{[^}]+\}/gm, '');

  var header = parsePTNHeader(text);

  var body = text.replace(/\[(\S+)\s+\"([^"]+)\"\]/g, '').trim();
  var moves = parsePTNMoves(body);
  if (header && moves) {
    return {
      tags: header,
      moves: moves
    }
  }
  return null;
}

function parsePTNHeader(header) {
  var tags = {};
  var match;
  var re = /\[(\S+)\s+\"([^"]+)\"\]/gm;
  while ((match = re.exec(header)) !== null) {
    tags[match[1]] = match[2];
  }
  return tags;
}

function parsePTNMoves(body) {
  var bits = body.split(/\s+/);
  var moves = [];
  for (var i = 0; i < bits.length; i++) {
    var tok = bits[i];
    if (tok.match(/\d+\./))
        continue;
    moves.push(tok);
  }
  return moves;
}

if(typeof(require) === 'function') {
  var ptn1 = (
    '[Site "PlayTak.com"]\n' +
      '[Event "Online Play"]\n' +
      '[Date "2016.10.22"]\n' +
      '[Time "22:06:19"]\n' +
      '[Player1 "nelhage"]\n' +
      '[Player2 "Ally"]\n' +
      '[Clock "10:0 +15"]\n' +
      '[Result "F-0"]\n' +
      '[Size "5"]\n' +
      '\n' +
      '1. a1 e1\n' +
      '2. d2 a2\n' +
      '3. a3 b2\n' +
      '4. b3 Cc3\n' +
      '5. Cc2 b4\n' +
      '6. b1 1c3<1\n' +
      '7. 1b1+1 2b3-2\n' +
      '8. Sb3 a4\n' +
      '9. e2 e4\n' +
      '10. d4 d5\n' +
      '11. c4 c5\n' +
      '12. c3 e5\n' +
      '13. b5 1b4+1\n' +
      '14. 1c4+1 2b5>2\n' +
      '15. Sb5 3c5-3\n' +
      '16. 1d4<1 1c5-1\n' +
      '17. 1c3+1 Sb4\n' +
      '18. 5c4>32 1b4>1\n' +
      '19. c3 2c4>2\n' +
      '20. c5 c4\n' +
      '21. b4 1c4+1\n' +
      '22. c4 5d4<23\n' +
      '23. 1b5>1 1e5-1\n' +
      '24. 2c5-2 4e4-112\n' +
      '25. d1 1d5<1\n' +
      '26. 4c4>13 4b4>4\n' +
      '27. d3 d5\n' +
      '28. e5 5c4>5\n' +
      '29. c4 Sb4\n' +
      '30. 1c2>1 c1\n' +
      '31. 2d2+11 4b2>13\n' +
      '32. 3e4-12 b1\n' +
      '33. 1d1<1 b2\n' +
      '34. 1b3-1 d1\n' +
      '35. 3e2-3 3d2+3\n' +
      '36. 5d4+5 2e3+11\n' +
      '37. 4d5>4 5d3+5\n' +
      '38. 5e1<5 Se3\n' +
      '39. b5')

  console.log(parsePTN(ptn1));
}
