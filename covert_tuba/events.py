from flask_socketio import SocketIO, join_room, emit
from flask import request
from . import controller
from . import socketio
import logging
logging = logging.getLogger('covert_tuba')

"""
Tic-Tac-Toe

API:
    - create_room(name, board_size)
        - returns p1
    - join_room(name)
        - return p1, p2, or spectator
        
    - play_move(grid_cell)
        - return success or fail
    
    - board_update:
        - return board_state
            status of board
            current player
            win status
    
"""
def validate_json_types(json, **kwargs):
    for key, value in kwargs.items():
        if key in json and json[key] is not None:
            try:
                json[key] = value(json[key])
            except ValueError:
                logging.ERROR("Failed to validate key: {key} in json {json} as {type}".format(key=key, json=json, type=value))
                return False
    return True
            
def validate_json_keys(json, keys, **kwargs):
    for key in keys:
        if key not in json:
            logging.Error("Key {key} not found in {json}".format(key=key, json=json))
            return False
        
    for key,value in kwargs.items():
        if key not in json:
            json[key] = value
    return True

@socketio.on('connect')
def test_connect():
    logging.debug("User {} Connected".format(request.sid))

@socketio.on('disconnect')
def test_disconnect():
    logging.debug("User {} Disconnected".format(request.sid))
    response = controller.unregister_player(request.sid)
    if response['code'] == 200:
        broadcast_message("{} has disconnected".format(response['role']), response['room_name'], theme='failure')
            
@socketio.on('join_board')
def join_board(json):
    if validate_json_types(json, name=str, spectator=bool) is False:
        return {'code': 400}
    if validate_json_keys(json, ['name'], spectator=False) is False:
        return {'code': 400}
    
    response = controller.register_player(json['name'], request.sid)
    if response['code'] == 200:
        join_room(json['name'])
        broadcast_message("New player has joined as {}".format(response['role']), json['name'])
        emit_board(json['name'])
    return response

@socketio.on('restart_board')
def restart_board(json):
    response = controller.player_to_room(request.sid)
    if response['code'] == 200:
        room_name = response['value']
        room_response = controller.restart_room(room_name)
        if room_response['code'] == 200:
            players = room_response['value']
            for player,role in players.items():
                response['role'] = role 
                logging.info("Sending role change for player {} in room {} role {}".format(player, room_name, role))
                emit('role_change', response, room=player)
        
        emit_board(room_name)
    return response

@socketio.on('create_board')
def create_board(json):
    if validate_json_types(json, board_size=int, name=str) is False:
        return {'code': 400}
    if validate_json_keys(json, ['board_size'], name=None) is False:
        return {'code': 400}

    response = controller.create_room(json['board_size'], json['name'])
    if response['code'] == 200:
        join_room(response['name'])
        response2 = controller.register_player(response['name'], request.sid)
        if 'role' in response2:
            response['role'] = response2['role']
        emit_board(response['name'])
        return response
    else:
        return response
    
@socketio.on('play_move') 
def play_move(location):
    response = controller.play_move(request.sid, int(location))
    if response['code'] == 200:
        emit_board(response['name'])
        return response
    return response

def emit_board(room_name):
    response = controller.get_room(room_name)
    if response['code'] == 200:
        board = response['value'].__serialize__()
        logging.debug("Firing Board Update For Room {room}".format(room=room_name))
        emit('board_update', board, broadcast=True, room=room_name, include_self=True)

def broadcast_message(msg, room_name, theme="success", duration=2000):
    payload = {"message": msg, "theme": theme, duration: duration, "code": 200}
    emit('send_notification', payload, broadcast=True, room=room_name, include_self=True)