<?php
#  FireCSS - See CSS changes in all browsers as you edit
#  Copyright (C) 2011  Julian Cox, Webspeed Ltd.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Main program
 * PHP Implementation of the FireCSS RoR server (RoR implementation author : Julian Cox)
 * 
 * @author  Simon Leblanc <contact@leblanc-simon.eu>
 * @version 0.1
 */

require_once dirname(__FILE__).DIRECTORY_SEPARATOR.'IFirecssSession.class.php';
require_once dirname(__FILE__).DIRECTORY_SEPARATOR.'FirecssSession.class.php';
require_once dirname(__FILE__).DIRECTORY_SEPARATOR.'FirecssCache.class.php';
require_once dirname(__FILE__).DIRECTORY_SEPARATOR.'FirecssController.class.php';

try {
  $session = new FirecssSession();
  $controller = new FirecssController($session);
  
  $controller_name  = $controller->getName();
  $params           = $controller->getRequestVar();
  
  $controller->$controller_name($params)->run();
} catch (Exception $e) {
  file_put_contents(dirname(__FILE__).'/logs.txt', date('YmdHis')."\t".$e->getMessage()."\n", FILE_APPEND);
}